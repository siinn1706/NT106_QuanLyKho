"""db_helpers.py - Helper functions to convert between SQLAlchemy models and Pydantic schemas"""

from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from . import schemas
from .database import (
    SupplierModel, ItemModel, StockTransactionModel, WarehouseModel,
    CompanyInfoModel, StockInRecordModel, StockOutRecordModel, UserModel
)


# =============================================================
# SUPPLIER HELPERS
# =============================================================

def supplier_model_to_schema(model: SupplierModel) -> schemas.Supplier:
    """Convert SupplierModel to Supplier schema"""
    return schemas.Supplier(
        id=model.id,
        name=model.name,
        tax_id=model.tax_id or "",
        address=model.address or "",
        phone=model.phone or "",
        email=model.email or "",
        bank_account=model.bank_account or "",
        bank_name=model.bank_name or "",
        notes=model.notes or "",
        outstanding_debt=model.outstanding_debt or 0.0,
    )


def supplier_schema_to_dict(schema: schemas.SupplierCreate) -> dict:
    """Convert SupplierCreate schema to dict for database"""
    return schema.model_dump()


# =============================================================
# ITEM HELPERS
# =============================================================

def item_model_to_schema(model: ItemModel) -> schemas.Item:
    """Convert ItemModel to Item schema"""
    return schemas.Item(
        id=model.id,
        name=model.name,
        sku=model.sku,
        unit=model.unit,
        price=model.price,
        category=model.category,
        supplier_id=model.supplier_id,
        min_stock=model.min_stock or 10,
        quantity=getattr(model, 'quantity', 0),  # Current stock
    )


def item_schema_to_dict(schema: schemas.ItemCreate) -> dict:
    """Convert ItemCreate schema to dict for database"""
    return schema.model_dump()


# =============================================================
# WAREHOUSE HELPERS
# =============================================================

def warehouse_model_to_schema(model: WarehouseModel) -> schemas.Warehouse:
    """Convert WarehouseModel to Warehouse schema"""
    managers = model.managers if model.managers else []
    return schemas.Warehouse(
        id=model.id,
        name=model.name,
        code=model.code,
        address=model.address or "",
        phone=model.phone or "",
        managers=[schemas.WarehouseManager(**m) if isinstance(m, dict) else m for m in managers],
        notes=model.notes or "",
        created_at=model.created_at,
        is_active=model.is_active or False,
    )


def warehouse_schema_to_dict(schema: schemas.WarehouseCreate) -> dict:
    """Convert WarehouseCreate schema to dict for database"""
    data = schema.model_dump()
    # Convert managers list to JSON-serializable format
    if 'managers' in data:
        data['managers'] = [m if isinstance(m, dict) else m.model_dump() for m in data['managers']]
    return data


# =============================================================
# STOCK TRANSACTION HELPERS
# =============================================================

def stock_transaction_model_to_schema(model: StockTransactionModel) -> schemas.StockTransaction:
    """Convert StockTransactionModel to StockTransaction schema"""
    return schemas.StockTransaction(
        id=model.id,
        type=model.type,
        item_id=model.item_id,
        quantity=model.quantity,
        note=model.note,
        timestamp=model.timestamp,
    )


# =============================================================
# COMPANY INFO HELPERS
# =============================================================

def company_info_model_to_schema(model: CompanyInfoModel) -> schemas.CompanyInfo:
    """Convert CompanyInfoModel to CompanyInfo schema"""
    return schemas.CompanyInfo(
        id=model.id,
        name=model.name or "",
        logo=model.logo or "",
        tax_id=model.tax_id or "",
        address=model.address or "",
        phone=model.phone or "",
        email=model.email or "",
        bank_name=model.bank_name or "",
        bank_account=model.bank_account or "",
        bank_branch=model.bank_branch or "",
    )


# =============================================================
# STOCK IN/OUT RECORD HELPERS
# =============================================================

def stock_in_record_model_to_schema(model: StockInRecordModel) -> schemas.StockInRecord:
    """Convert StockInRecordModel to StockInRecord schema"""
    items = model.items if model.items else []
    return schemas.StockInRecord(
        id=model.id,
        warehouse_code=model.warehouse_code,
        supplier=model.supplier,
        date=model.date,
        note=model.note or "",
        tax_rate=model.tax_rate or 0.0,
        payment_method=model.payment_method or "tiền_mặt",
        payment_bank_account=model.payment_bank_account or "",
        payment_bank_name=model.payment_bank_name or "",
        items=[schemas.StockInItem(**item) if isinstance(item, dict) else item for item in items],
        total_quantity=model.total_quantity or 0,
        total_amount=model.total_amount or 0.0,
        created_at=model.created_at.isoformat() if isinstance(model.created_at, datetime) else model.created_at,
        status=model.status or "completed",
    )


def stock_out_record_model_to_schema(model: StockOutRecordModel) -> schemas.StockOutRecord:
    """Convert StockOutRecordModel to StockOutRecord schema"""
    items = model.items if model.items else []
    return schemas.StockOutRecord(
        id=model.id,
        warehouse_code=model.warehouse_code,
        recipient=model.recipient,
        purpose=model.purpose,
        date=model.date,
        note=model.note or "",
        tax_rate=model.tax_rate or 0.0,
        items=[schemas.StockOutItem(**item) if isinstance(item, dict) else item for item in items],
        total_quantity=model.total_quantity or 0,
        total_amount=model.total_amount,
        created_at=model.created_at.isoformat() if isinstance(model.created_at, datetime) else model.created_at,
        status=model.status or "completed",
    )

