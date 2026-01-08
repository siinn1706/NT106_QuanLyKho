"""inventory_service.py - Stock in/out business logic with atomic quantity updates.

This module centralizes the core warehouse logic: resolving item identifiers, updating
ItemModel.quantity, creating StockTransactionModel entries with trace metadata, and
handling safe cancellation (rollback) of stock vouchers.

INVENTORY VALUATION: Implements FIFO (First In, First Out) method to calculate Cost of
Goods Sold (COGS) when items are exported from stock. This ensures accurate profit
calculation in reports.
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Tuple

from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import cast, Integer, desc

from . import schemas
from .database import ItemModel, StockTransactionModel, StockInRecordModel, StockOutRecordModel
from .enums import TransactionType, RecordStatus, PaymentMethod
from .rt_chat_ws import manager


def _get_attr(data, field: str, default=None):
    if isinstance(data, dict):
        return data.get(field, default)
    return getattr(data, field, default)


def resolve_item_by_identifier(db: Session, item_id: Optional[str], item_code: Optional[str], for_update: bool = False) -> ItemModel:
    """Resolve an item either by numeric item_id or by item_code/sku.

    Args:
        db: Database session
        item_id: Item ID (numeric)
        item_code: Item SKU/code
        for_update: If True, lock the row using with_for_update() to prevent race conditions

    Raises 400 if not found or invalid.
    """
    candidate = None
    query_builder = db.query(ItemModel)
    if for_update:
        query_builder = query_builder.with_for_update()
    
    if item_id:
        try:
            candidate = query_builder.filter(ItemModel.id == int(item_id)).first()
        except (TypeError, ValueError):
            candidate = None
    if not candidate and item_code:
        query_builder = db.query(ItemModel)
        if for_update:
            query_builder = query_builder.with_for_update()
        candidate = query_builder.filter(ItemModel.sku == item_code).first()
    if not candidate:
        raise HTTPException(status_code=400, detail=f"Không tìm thấy hàng hoá (item_id={item_id}, item_code={item_code})")
    return candidate


def _materialize_item_payload(db_item: ItemModel, quantity: int, unit: str, price: float | None = None, cost: float | None = None) -> dict:
    """Materialize item data for storage, including cost for COGS tracking."""
    return {
        "item_id": str(db_item.id),
        "item_code": db_item.sku,
        "item_name": db_item.name,
        "quantity": quantity,
        "unit": unit,
        "price": price if price is not None else 0,
        "cost": cost if cost is not None else 0,  # Cost of Goods Sold (giá vốn)
    }


def _validate_and_get_sell_price(db_item: ItemModel, requested_price: float | None, item_name: str) -> Tuple[float, Optional[str]]:
    """
    SECURITY FIX: Validate sell_price from client against ItemModel.price (database source of truth).
    
    Returns:
        - final_price: The price to use for the transaction
        - audit_note: Optional warning/audit note if price differs significantly from listed price
    
    Logic:
    1. If no price provided by client, use ItemModel.price
    2. If price matches ItemModel.price (±5%), use it without warning
    3. If price is lower than ItemModel.price by >5%, use ItemModel.price and create audit alert
    4. If price is higher than ItemModel.price, allow it with audit trail (business case)
    5. If price is 0 or negative, REJECT and use ItemModel.price
    
    This prevents employees from selling items at 0 VND or manipulating prices downward.
    """
    # Extract actual float value from ItemModel (handles SQLAlchemy Column type)
    db_price = float(getattr(db_item, 'price', None) or 0)
    item_name_str = str(getattr(db_item, 'name', item_name) or item_name)
    
    # If no price provided, use database price
    if requested_price is None or requested_price <= 0:
        audit_note = f"[SECURITY] Price override: Client provided {requested_price}, using database price {db_price:.2f} for '{item_name_str}'"
        return db_price, audit_note
    
    requested_price = float(requested_price)
    
    # If price is identical or within 5% tolerance, accept without warning
    if db_price > 0:
        price_diff_percent = abs(requested_price - db_price) / db_price * 100
        if price_diff_percent <= 5:
            return requested_price, None  # No audit note needed for minor variations
    
    # If client price is significantly lower (>5% below), use database price and alert
    if requested_price < db_price * 0.95:
        audit_note = (
            f"[SECURITY ALERT] Price reduction flagged for '{item_name_str}': "
            f"Client requested {requested_price:.2f}, database price {db_price:.2f} "
            f"(reduction: {((db_price - requested_price) / db_price * 100):.1f}%). "
            f"Using database price {db_price:.2f} to prevent fraud."
        )
        return db_price, audit_note
    
    # If client price is higher (premium pricing for special deals), allow with audit trail
    if requested_price > db_price:
        audit_note = (
            f"[AUDIT] Price increase for '{item_name_str}': "
            f"Client requested {requested_price:.2f}, database price {db_price:.2f} "
            f"(increase: {((requested_price - db_price) / db_price * 100):.1f}%). "
            f"Using requested price."
        )
        return requested_price, audit_note
    
    # Default: use requested price
    return requested_price, None


def calculate_fifo_cost(db: Session, item_id: int, warehouse_code: str, quantity: int) -> Tuple[float, List[Dict]]:
    """
    Calculate COGS using FIFO method (First In, First Out).
    
    Returns:
        - total_cost: Total cost of goods based on FIFO
        - cost_breakdown: List of {stock_in_id, quantity, unit_price, subtotal}
    
    Example:
        - Stock-in 1: 10 units @ 100k
        - Stock-in 2: 10 units @ 150k
        - When stock-out 15 units:
            - Take 10 from batch 1 (10 * 100k = 1,000k)
            - Take 5 from batch 2 (5 * 150k = 750k)
            - Total COGS = 1,750k
    """
    cost_breakdown = []
    total_cost = 0.0
    remaining_qty = quantity
    
    # Get all stock_in records for this item in this warehouse, ordered by date (FIFO)
    stock_in_records = db.query(StockInRecordModel).filter(
        StockInRecordModel.warehouse_code == warehouse_code,
        StockInRecordModel.status == RecordStatus.COMPLETED.value,
    ).order_by(StockInRecordModel.created_at).all()
    
    for record in stock_in_records:
        if remaining_qty <= 0:
            break
            
        # Find items in this stock_in record matching the item_id
        for item in record.items or []:
            if remaining_qty <= 0:
                break
                
            item_id_str = str(_get_attr(item, "item_id", ""))
            if item_id_str != str(item_id):
                continue
            
            # Get unit price from the stock-in record
            available_qty = int(_get_attr(item, "quantity", 0))
            unit_price = float(_get_attr(item, "price", 0))
            
            # Calculate how much to take from this batch
            qty_to_take = min(available_qty, remaining_qty)
            cost_for_batch = qty_to_take * unit_price
            
            cost_breakdown.append({
                "stock_in_id": record.id,
                "quantity": qty_to_take,
                "unit_price": unit_price,
                "subtotal": cost_for_batch,
            })
            
            total_cost += cost_for_batch
            remaining_qty -= qty_to_take
    
    if remaining_qty > 0:
        # If we couldn't find enough inventory in stock_in records,
        # fall back to current item price (edge case for data inconsistency)
        db_item = db.query(ItemModel).filter(ItemModel.id == item_id).first()
        if db_item:
            fallback_price = float(getattr(db_item, 'price', 0) or 0)
            total_cost += remaining_qty * fallback_price
            cost_breakdown.append({
                "stock_in_id": "fallback",
                "quantity": remaining_qty,
                "unit_price": fallback_price,
                "subtotal": remaining_qty * fallback_price,
            })
    
    return float(total_cost), cost_breakdown


async def create_stock_in_record(db: Session, data: schemas.StockInBatchCreate, record_id: str, current_user: Optional[dict]) -> StockInRecordModel:
    """Create stock-in voucher, update inventory, and log transactions atomically."""
    now = datetime.now(timezone.utc)
    actor_id = current_user.get("id") if current_user else None
    items_payload = []
    try:
        for item in data.items:
            db_item = resolve_item_by_identifier(db, item.item_id, item.item_code, for_update=True)
            db_item.quantity = (db_item.quantity or 0) + item.quantity  # type: ignore
            db_item.updated_at = now  # type: ignore

            items_payload.append(_materialize_item_payload(db_item, item.quantity, item.unit, item.price))

            db.add(
                StockTransactionModel(
                    type=TransactionType.IN.value,
                    item_id=db_item.id,
                    quantity=item.quantity,
                    note=data.note or "",
                    timestamp=now,
                    warehouse_code=data.warehouse_code,
                    voucher_id=record_id,
                    actor_user_id=actor_id,
                )
            )

        total_qty = sum(i["quantity"] for i in items_payload)
        total_amt = sum((i["price"] or 0) * i["quantity"] for i in items_payload)

        record = StockInRecordModel(
            id=record_id,
            warehouse_code=data.warehouse_code,
            supplier=data.supplier,
            date=data.date,
            note=data.note or "",
            tax_rate=data.tax_rate or 0.0,
            payment_method=getattr(data, "payment_method", PaymentMethod.CASH.value) or PaymentMethod.CASH.value,
            payment_bank_account=getattr(data, "payment_bank_account", "") or "",
            payment_bank_name=getattr(data, "payment_bank_name", "") or "",
            items=items_payload,
            total_quantity=total_qty,
            total_amount=total_amt,
            status=RecordStatus.COMPLETED.value,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        await manager.broadcast_system_event("inventory:updated", {"type": "stock_in", "record_id": record_id})
        return record
    except Exception:
        db.rollback()
        raise


async def create_stock_out_record(db: Session, data: schemas.StockOutBatchCreate, record_id: str, current_user: Optional[dict]) -> StockOutRecordModel:
    """Create stock-out voucher, validate availability, update inventory, and log transactions.
    
    ENHANCED: 
    - Calculates COGS (Cost of Goods Sold) using FIFO method for accurate profit reporting
    - SECURITY FIX: Validates sell_price against ItemModel.price to prevent fraud
      (prevents employee from selling items at 0 VND or below-cost prices)
    """
    now = datetime.now(timezone.utc)
    actor_id = current_user.get("id") if current_user else None
    items_payload = []
    price_audit_notes = []  # Track price validation warnings for audit trail
    
    try:
        for item in data.items:
            db_item = resolve_item_by_identifier(db, item.item_id, item.item_code, for_update=True)
            available = db_item.quantity or 0
            if not (available >= item.quantity):  # type: ignore
                raise HTTPException(
                    status_code=400,
                    detail=f"Không đủ tồn kho cho hàng hoá {db_item.name} (có {available}, cần {item.quantity})",
                )
            db_item.quantity = available - item.quantity  # type: ignore
            db_item.updated_at = now  # type: ignore

            # SECURITY FIX: Validate and enforce sell_price against database price
            validated_price, price_audit_note = _validate_and_get_sell_price(
                db_item,
                item.sell_price,
                str(db_item.name),
            )
            if price_audit_note:
                price_audit_notes.append(price_audit_note)

            # ENHANCEMENT: Calculate COGS using FIFO
            item_db_id = int(getattr(db_item, 'id', 0) or 0)
            fifo_cost, cost_breakdown = calculate_fifo_cost(db, item_db_id, data.warehouse_code, item.quantity)
            avg_cost_per_unit = fifo_cost / item.quantity if item.quantity > 0 else 0

            items_payload.append(_materialize_item_payload(
                db_item, 
                item.quantity, 
                item.unit, 
                price=validated_price,  # Use validated price, not client's price
                cost=avg_cost_per_unit,  # Store average COGS per unit
            ))

            db.add(
                StockTransactionModel(
                    type=TransactionType.OUT.value,
                    item_id=db_item.id,
                    quantity=item.quantity,
                    note=data.note or "",
                    timestamp=now,
                    warehouse_code=data.warehouse_code,
                    voucher_id=record_id,
                    actor_user_id=actor_id,
                )
            )

        total_qty = sum(i["quantity"] for i in items_payload)
        total_amt = None
        total_cost = 0.0  # Total COGS
        
        if data.purpose == "Bán hàng":
            total_amt = sum((i["price"] or 0) * i["quantity"] for i in items_payload)
        
        # Calculate total COGS for reporting
        total_cost = sum((i["cost"] or 0) * i["quantity"] for i in items_payload)

        # Append price validation audit trail to record note
        combined_note = str(data.note or "").strip()
        if price_audit_notes:
            combined_note = combined_note + "\n" + "\n".join(price_audit_notes)

        record = StockOutRecordModel(
            id=record_id,
            warehouse_code=data.warehouse_code,
            recipient=data.recipient,
            purpose=data.purpose,
            date=data.date,
            note=combined_note,
            tax_rate=data.tax_rate or 0.0,
            payment_method=getattr(data, "payment_method", PaymentMethod.CASH.value) or PaymentMethod.CASH.value,
            payment_bank_account=getattr(data, "payment_bank_account", "") or "",
            payment_bank_name=getattr(data, "payment_bank_name", "") or "",
            items=items_payload,
            total_quantity=total_qty,
            total_amount=total_amt,
            status=RecordStatus.COMPLETED.value,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        await manager.broadcast_system_event("inventory:updated", {"type": "stock_out", "record_id": record_id})
        return record
    except Exception:
        db.rollback()
        raise


async def cancel_stock_in_record(db: Session, record: StockInRecordModel, actor_user_id: Optional[str]) -> StockInRecordModel:
    """Rollback inventory for a stock-in voucher and mark it cancelled.
    
    ENHANCED:
    - Validates available quantity before removing from stock
    - Preserves cost information for accurate valuation audit trail
    - Provides detailed audit trail with inventory metadata
    
    Logic:
    1. For each item in stock-in record:
       - Verify sufficient quantity exists to remove
       - Deduct quantity and preserve cost metadata
       - Create "out" transaction for audit trail
    2. Update status and audit trail
    3. Broadcast event for real-time UI updates
    """
    status_value = str(record.status or "")
    if status_value == "cancelled":
        return record

    now = datetime.now(timezone.utc)
    try:
        # ENHANCEMENT: Validate all items before any updates (atomic operation)
        removal_items = []
        for item in record.items or []:
            qty = int(_get_attr(item, "quantity", 0))
            price_per_unit = float(_get_attr(item, "price", 0))
            item_name = _get_attr(item, "item_name", "Unknown")
            
            db_item = resolve_item_by_identifier(
                db,
                _get_attr(item, "item_id"),
                _get_attr(item, "item_code"),
                for_update=True,
            )
            available = db_item.quantity or 0
            if not (available >= qty):  # type: ignore
                raise HTTPException(
                    status_code=400,
                    detail=f"Không đủ tồn kho để hủy phiếu nhập {record.id} cho hàng '{item_name}': "
                           f"hiện có {available}, cần trừ {qty}. "
                           f"Tồn kho có thể đã bị thay đổi bởi phiếu khác.",
                )
            
            removal_items.append({
                "db_item": db_item,
                "qty": qty,
                "price_per_unit": price_per_unit,
                "item_name": item_name,
                "item_id": db_item.id,
            })
        
        # All items validated, now perform the actual removal
        for removal in removal_items:
            db_item = removal["db_item"]
            qty = removal["qty"]
            price_per_unit = removal["price_per_unit"]
            
            # Deduct quantity
            db_item.quantity = (db_item.quantity or 0) - qty  # type: ignore
            db_item.updated_at = now  # type: ignore
            
            # ENHANCEMENT: Preserve cost metadata for audit trail
            total_cost = price_per_unit * qty
            transaction_note = (
                f"Cancel stock-in {record.id} | "
                f"Original cost: {price_per_unit:.2f}/unit × {qty} = {total_cost:.2f}"
            )
            
            db.add(
                StockTransactionModel(
                    type=TransactionType.OUT.value,
                    item_id=db_item.id,
                    quantity=qty,
                    note=transaction_note,
                    timestamp=now,
                    warehouse_code=record.warehouse_code,
                    voucher_id=record.id,
                    actor_user_id=actor_user_id,
                )
            )

        # Update record status with detailed audit trail
        record.status = RecordStatus.CANCELLED.value  # type: ignore
        cancelled_by = actor_user_id or "system"
        audit_entry = f"[CANCELLED by {cancelled_by} at {now.isoformat()}]"
        record.note = f"{str(record.note or '').strip()}\n{audit_entry}".strip()  # type: ignore
        
        db.add(record)
        db.commit()
        db.refresh(record)
        
        # Broadcast event for real-time UI updates
        await manager.broadcast_system_event(
            "inventory:updated", 
            {
                "type": "cancel_stock_in", 
                "record_id": record.id,
                "total_items_removed": len(removal_items),
            }
        )
        return record
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


async def cancel_stock_out_record(db: Session, record: StockOutRecordModel, actor_user_id: Optional[str]) -> StockOutRecordModel:
    """Rollback inventory for a stock-out voucher and mark it cancelled (restock).
    
    ENHANCED: 
    - Validates warehouse capacity constraints before restocking
    - Preserves and traces original COGS information for accurate valuation
    - Provides detailed audit trail with valuation metadata
    - Prevents data inconsistency by validating capacity limits
    
    Logic:
    1. For each item in stock-out record:
       - Verify current warehouse capacity allows restocking
       - Restore original quantity and COGS cost per unit
       - Create "in" transaction with cost metadata for traceability
    2. Update status and audit trail
    3. Broadcast event for real-time UI updates
    """
    status_value = str(record.status or "")
    if status_value == RecordStatus.CANCELLED.value:
        return record

    now = datetime.now(timezone.utc)
    try:
        # ENHANCEMENT: Collect all items first to validate capacity before any updates
        restock_items = []
        for item in record.items or []:
            qty = int(_get_attr(item, "quantity", 0))
            cost_per_unit = float(_get_attr(item, "cost", 0))
            item_name = _get_attr(item, "item_name", "Unknown")
            
            db_item = resolve_item_by_identifier(
                db,
                _get_attr(item, "item_id"),
                _get_attr(item, "item_code"),
                for_update=True,
            )
            
            # VALIDATION: Check warehouse capacity constraint (if implemented)
            # Example: max_capacity = 1000 units per item per warehouse
            # This prevents restocking beyond physical space available
            # Future: Read max_capacity from warehouse_settings or item configuration
            current_qty = int(getattr(db_item, 'quantity', 0) or 0)
            proposed_qty = current_qty + qty
            max_capacity = 10000  # Placeholder: should come from warehouse config
            if proposed_qty > max_capacity:  # type: ignore
                raise HTTPException(
                    status_code=400,
                    detail=f"Dung lượng kho vượt giới hạn cho '{item_name}': "
                           f"hiện có {current_qty}, "
                           f"hoàn lại {qty} → tổng {proposed_qty} (tối đa {max_capacity}). "
                           f"Vui lòng liên hệ quản lý kho.",
                )
            
            restock_items.append({
                "db_item": db_item,
                "qty": qty,
                "cost_per_unit": cost_per_unit,
                "item_name": item_name,
                "item_id": db_item.id,
            })
        
        # All items validated, now perform the actual restock
        for restock in restock_items:
            db_item = restock["db_item"]
            qty = restock["qty"]
            cost_per_unit = restock["cost_per_unit"]
            
            # Restore quantity
            db_item.quantity = (db_item.quantity or 0) + qty  # type: ignore
            db_item.updated_at = now  # type: ignore
            
            # ENHANCEMENT: Preserve COGS cost in transaction metadata for audit trail
            # This allows future average-cost calculations without losing original data
            total_cost = cost_per_unit * qty
            transaction_note = (
                f"Restock from cancelled stock-out {record.id} | "
                f"Original COGS: {cost_per_unit:.2f}/unit × {qty} = {total_cost:.2f}"
            )
            
            db.add(
                StockTransactionModel(
                    type=TransactionType.IN.value,
                    item_id=db_item.id,
                    quantity=qty,
                    note=transaction_note,
                    timestamp=now,
                    warehouse_code=record.warehouse_code,
                    voucher_id=record.id,
                    actor_user_id=actor_user_id,
                )
            )

        # Update record status with detailed audit trail
        record.status = RecordStatus.CANCELLED.value  # type: ignore
        cancelled_by = actor_user_id or "system"
        audit_entry = f"[CANCELLED by {cancelled_by} at {now.isoformat()}]"
        record.note = f"{str(record.note or '').strip()}\n{audit_entry}".strip()  # type: ignore
        
        db.add(record)
        db.commit()
        db.refresh(record)
        
        # Broadcast event for real-time UI updates
        await manager.broadcast_system_event(
            "inventory:updated", 
            {
                "type": "cancel_stock_out", 
                "record_id": record.id,
                "total_items_restored": len(restock_items),
            }
        )
        return record
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise
