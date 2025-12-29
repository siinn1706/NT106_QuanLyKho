"""search_service.py - Shared search, filter, and pagination utilities."""

from typing import Optional, Any

from sqlalchemy import or_
from sqlalchemy.orm import Session

from .database import ItemModel, SupplierModel, StockInRecordModel, StockOutRecordModel


def paginate_query(query: Any, page: Optional[int], page_size: Optional[int], max_page_size: int = 200) -> tuple[list[Any], Optional[int], Optional[int], Optional[int], bool]:
    """Paginate a SQLAlchemy query. Returns (items, total, page, page_size, is_paginated)."""
    if page is None and page_size is None:
        return list(query.all()), None, None, None, False

    page = page or 1
    page_size = min(page_size or 20, max_page_size)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return list(items), int(total), int(page), int(page_size), True


def global_search(db: Session, q: str, limit: int = 5) -> dict[str, list[dict[str, object]]]:
    pattern = f"%{q}%"

    items = (
        db.query(ItemModel)
        .filter(or_(ItemModel.name.ilike(pattern), ItemModel.sku.ilike(pattern)))
        .order_by(ItemModel.updated_at.desc())
        .limit(limit)
        .all()
    )
    suppliers = (
        db.query(SupplierModel)
        .filter(
            or_(
                SupplierModel.name.ilike(pattern),
                SupplierModel.phone.ilike(pattern),
                SupplierModel.tax_id.ilike(pattern),
            )
        )
        .order_by(SupplierModel.updated_at.desc())
        .limit(limit)
        .all()
    )
    stock_in = (
        db.query(StockInRecordModel)
        .filter(
            or_(
                StockInRecordModel.id.ilike(pattern),
                StockInRecordModel.supplier.ilike(pattern),
                StockInRecordModel.note.ilike(pattern),
            )
        )
        .order_by(StockInRecordModel.created_at.desc())
        .limit(limit)
        .all()
    )
    stock_out = (
        db.query(StockOutRecordModel)
        .filter(
            or_(
                StockOutRecordModel.id.ilike(pattern),
                StockOutRecordModel.recipient.ilike(pattern),
                StockOutRecordModel.note.ilike(pattern),
            )
        )
        .order_by(StockOutRecordModel.created_at.desc())
        .limit(limit)
        .all()
    )

    return {
        "items": [
            {
                "id": i.id,
                "sku": i.sku,
                "name": i.name,
                "unit": i.unit,
                "quantity": i.quantity or 0,
            }
            for i in items
        ],
        "suppliers": [
            {
                "id": s.id,
                "name": s.name,
                "phone": s.phone or "",
                "tax_id": s.tax_id or "",
            }
            for s in suppliers
        ],
        "stock_in": [
            {
                "id": r.id,
                "warehouse_code": r.warehouse_code,
                "supplier": r.supplier,
                "date": r.date,
            }
            for r in stock_in
        ],
        "stock_out": [
            {
                "id": r.id,
                "warehouse_code": r.warehouse_code,
                "recipient": r.recipient,
                "date": r.date,
            }
            for r in stock_out
        ],
    }
