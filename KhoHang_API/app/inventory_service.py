"""inventory_service.py - Stock in/out business logic with atomic quantity updates.

This module centralizes the core warehouse logic: resolving item identifiers, updating
ItemModel.quantity, creating StockTransactionModel entries with trace metadata, and
handling safe cancellation (rollback) of stock vouchers.
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from . import schemas
from .database import ItemModel, StockTransactionModel, StockInRecordModel, StockOutRecordModel


def _get_attr(data, field: str, default=None):
    if isinstance(data, dict):
        return data.get(field, default)
    return getattr(data, field, default)


def resolve_item_by_identifier(db: Session, item_id: Optional[str], item_code: Optional[str]) -> ItemModel:
    """Resolve an item either by numeric item_id or by item_code/sku.

    Raises 400 if not found or invalid.
    """
    candidate = None
    if item_id:
        try:
            candidate = db.query(ItemModel).filter(ItemModel.id == int(item_id)).first()
        except (TypeError, ValueError):
            candidate = None
    if not candidate and item_code:
        candidate = db.query(ItemModel).filter(ItemModel.sku == item_code).first()
    if not candidate:
        raise HTTPException(status_code=400, detail=f"Không tìm thấy hàng hoá (item_id={item_id}, item_code={item_code})")
    return candidate


def _materialize_item_payload(db_item: ItemModel, quantity: int, unit: str, price: float | None = None) -> dict:
    return {
        "item_id": str(db_item.id),
        "item_code": db_item.sku,
        "item_name": db_item.name,
        "quantity": quantity,
        "unit": unit,
        "price": price if price is not None else 0,
    }


def create_stock_in_record(db: Session, data: schemas.StockInBatchCreate, record_id: str, current_user: Optional[dict]) -> StockInRecordModel:
    """Create stock-in voucher, update inventory, and log transactions atomically."""
    now = datetime.now(timezone.utc)
    actor_id = current_user.get("id") if current_user else None
    items_payload = []
    try:
        for item in data.items:
            db_item = resolve_item_by_identifier(db, item.item_id, item.item_code)
            db_item.quantity = (db_item.quantity or 0) + item.quantity
            db_item.updated_at = now

            items_payload.append(_materialize_item_payload(db_item, item.quantity, item.unit, item.price))

            db.add(
                StockTransactionModel(
                    type="in",
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
            payment_method=getattr(data, "payment_method", "tiền_mặt") or "tiền_mặt",
            payment_bank_account=getattr(data, "payment_bank_account", "") or "",
            payment_bank_name=getattr(data, "payment_bank_name", "") or "",
            items=items_payload,
            total_quantity=total_qty,
            total_amount=total_amt,
            status="completed",
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
    except Exception:
        db.rollback()
        raise


def create_stock_out_record(db: Session, data: schemas.StockOutBatchCreate, record_id: str, current_user: Optional[dict]) -> StockOutRecordModel:
    """Create stock-out voucher, validate availability, update inventory, and log transactions."""
    now = datetime.now(timezone.utc)
    actor_id = current_user.get("id") if current_user else None
    items_payload = []
    try:
        for item in data.items:
            db_item = resolve_item_by_identifier(db, item.item_id, item.item_code)
            available = db_item.quantity or 0
            if available < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Không đủ tồn kho cho hàng hoá {db_item.name} (có {available}, cần {item.quantity})",
                )
            db_item.quantity = available - item.quantity
            db_item.updated_at = now

            items_payload.append(_materialize_item_payload(db_item, item.quantity, item.unit, item.sell_price))

            db.add(
                StockTransactionModel(
                    type="out",
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
        if data.purpose == "Bán hàng":
            total_amt = sum((i["price"] or 0) * i["quantity"] for i in items_payload)

        record = StockOutRecordModel(
            id=record_id,
            warehouse_code=data.warehouse_code,
            recipient=data.recipient,
            purpose=data.purpose,
            date=data.date,
            note=data.note or "",
            tax_rate=data.tax_rate or 0.0,
            payment_method=getattr(data, "payment_method", "tiền_mặt") or "tiền_mặt",
            payment_bank_account=getattr(data, "payment_bank_account", "") or "",
            payment_bank_name=getattr(data, "payment_bank_name", "") or "",
            items=items_payload,
            total_quantity=total_qty,
            total_amount=total_amt,
            status="completed",
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
    except Exception:
        db.rollback()
        raise


def cancel_stock_in_record(db: Session, record: StockInRecordModel, actor_user_id: Optional[str]) -> StockInRecordModel:
    """Rollback inventory for a stock-in voucher and mark it cancelled."""
    if record.status == "cancelled":
        return record

    now = datetime.now(timezone.utc)
    try:
        for item in record.items or []:
            qty = int(_get_attr(item, "quantity", 0))
            db_item = resolve_item_by_identifier(
                db,
                _get_attr(item, "item_id"),
                _get_attr(item, "item_code"),
            )
            available = db_item.quantity or 0
            if available < qty:
                raise HTTPException(
                    status_code=400,
                    detail=f"Không đủ tồn kho để hủy phiếu nhập {record.id} cho hàng {db_item.name} (có {available}, cần trừ {qty})",
                )
            db_item.quantity = available - qty
            db_item.updated_at = now
            db.add(
                StockTransactionModel(
                    type="out",
                    item_id=db_item.id,
                    quantity=qty,
                    note=f"Cancel stock-in {record.id}",
                    timestamp=now,
                    warehouse_code=record.warehouse_code,
                    voucher_id=record.id,
                    actor_user_id=actor_user_id,
                )
            )

        record.status = "cancelled"
        record.note = (record.note or "").strip()
        record.note = f"{record.note}\n[CANCELLED at {now.isoformat()}]".strip()
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
    except Exception:
        db.rollback()
        raise


def cancel_stock_out_record(db: Session, record: StockOutRecordModel, actor_user_id: Optional[str]) -> StockOutRecordModel:
    """Rollback inventory for a stock-out voucher and mark it cancelled (restock)."""
    if record.status == "cancelled":
        return record

    now = datetime.now(timezone.utc)
    try:
        for item in record.items or []:
            qty = int(_get_attr(item, "quantity", 0))
            db_item = resolve_item_by_identifier(
                db,
                _get_attr(item, "item_id"),
                _get_attr(item, "item_code"),
            )
            db_item.quantity = (db_item.quantity or 0) + qty
            db_item.updated_at = now
            db.add(
                StockTransactionModel(
                    type="in",
                    item_id=db_item.id,
                    quantity=qty,
                    note=f"Cancel stock-out {record.id}",
                    timestamp=now,
                    warehouse_code=record.warehouse_code,
                    voucher_id=record.id,
                    actor_user_id=actor_user_id,
                )
            )

        record.status = "cancelled"
        record.note = (record.note or "").strip()
        record.note = f"{record.note}\n[CANCELLED at {now.isoformat()}]".strip()
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
    except Exception:
        db.rollback()
        raise
