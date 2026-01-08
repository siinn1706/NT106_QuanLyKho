"""Test cases for enhanced restock logic (cancel_stock_out/in records)

File: test_restock_logic.py
Location: KhoHang_API/
Description: Comprehensive tests for atomic operations, capacity checking, and COGS traceability
"""

import pytest
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.inventory_service import (
    cancel_stock_out_record,
    cancel_stock_in_record,
    create_stock_out_record,
    create_stock_in_record,
)
from app.database import ItemModel, StockTransactionModel, StockOutRecordModel, StockInRecordModel


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def sample_item(db: Session) -> ItemModel:
    """Create a sample item for testing"""
    item = ItemModel(
        name="Test Product",
        sku="TEST-001",
        unit="chiếc",
        price=10000.0,
        category="Electronics",
        quantity=100,
        min_stock=5,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@pytest.fixture
def sample_stock_out_record(db: Session, sample_item: ItemModel) -> StockOutRecordModel:
    """Create a sample stock-out record with COGS tracking"""
    record = StockOutRecordModel(
        id="SO-2024-12-001",
        warehouse_code="KHO-1",
        recipient="Customer ABC",
        purpose="Bán hàng",
        date="2024-12-01",
        note="Sample stock-out",
        items=[
            {
                "item_id": str(sample_item.id),
                "item_code": sample_item.sku,
                "item_name": sample_item.name,
                "quantity": 10,
                "unit": "chiếc",
                "price": 15000.0,  # sell price
                "cost": 8000.0,  # COGS per unit
            }
        ],
        total_quantity=10,
        total_amount=150000.0,
        status="completed",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@pytest.fixture
def sample_stock_in_record(db: Session, sample_item: ItemModel) -> StockInRecordModel:
    """Create a sample stock-in record"""
    record = StockInRecordModel(
        id="SI-2024-11-001",
        warehouse_code="KHO-1",
        supplier="Supplier XYZ",
        date="2024-11-01",
        note="Sample stock-in",
        items=[
            {
                "item_id": str(sample_item.id),
                "item_code": sample_item.sku,
                "item_name": sample_item.name,
                "quantity": 20,
                "unit": "chiếc",
                "price": 5000.0,
                "cost": 5000.0,
            }
        ],
        total_quantity=20,
        total_amount=100000.0,
        status="completed",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# ============================================================================
# TEST CASES: cancel_stock_out_record
# ============================================================================

class TestCancelStockOut:
    """Test suite for cancel_stock_out_record enhancement"""

    async def test_cancel_stock_out_happy_path(
        self,
        db: Session,
        sample_item: ItemModel,
        sample_stock_out_record: StockOutRecordModel,
    ):
        """Test normal cancellation of stock-out with COGS preservation"""
        # Arrange
        initial_qty = sample_item.quantity
        expected_qty = initial_qty + 10  # 100 + 10 = 110
        actor_user = "user@example.com"

        # Act
        result = await cancel_stock_out_record(db, sample_stock_out_record, actor_user)

        # Assert
        assert result.status == "cancelled"
        assert "[CANCELLED by user@example.com at" in result.note
        
        # Verify quantity restored
        db.refresh(sample_item)
        assert sample_item.quantity == expected_qty
        
        # Verify transaction created with COGS metadata
        transactions = db.query(StockTransactionModel).filter(
            StockTransactionModel.voucher_id == sample_stock_out_record.id,
            StockTransactionModel.type == "in",
        ).all()
        assert len(transactions) == 1
        
        # Verify COGS info in transaction note
        transaction = transactions[0]
        assert "Original COGS: 8000.00/unit" in transaction.note
        assert "10 = 80000.00" in transaction.note
        assert f"Restock from cancelled stock-out {sample_stock_out_record.id}" in transaction.note

    async def test_cancel_stock_out_already_cancelled(
        self,
        db: Session,
        sample_stock_out_record: StockOutRecordModel,
    ):
        """Test that cancelling already-cancelled record returns immediately"""
        # Arrange
        sample_stock_out_record.status = "cancelled"
        db.add(sample_stock_out_record)
        db.commit()

        initial_qty = sample_stock_out_record.items[0]["quantity"]

        # Act
        result = await cancel_stock_out_record(db, sample_stock_out_record, "user")

        # Assert
        assert result.status == "cancelled"
        # Should return early without changes
        transactions = db.query(StockTransactionModel).filter(
            StockTransactionModel.voucher_id == sample_stock_out_record.id,
        ).all()
        assert len(transactions) == 0

    async def test_cancel_stock_out_capacity_exceeded(
        self,
        db: Session,
        sample_item: ItemModel,
        sample_stock_out_record: StockOutRecordModel,
    ):
        """Test that capacity validation prevents overstocking"""
        # Arrange
        # Set item quantity very high to simulate capacity limit
        sample_item.quantity = 9995
        db.add(sample_item)
        db.commit()

        # Update record to return 10 units → 9995 + 10 = 10005 > 10000
        sample_stock_out_record.items[0]["quantity"] = 10

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await cancel_stock_out_record(db, sample_stock_out_record, "user")
        
        assert exc_info.value.status_code == 400
        assert "Dung lượng kho vượt giới hạn" in exc_info.value.detail
        assert "10005" in exc_info.value.detail
        assert "10000" in exc_info.value.detail

    async def test_cancel_stock_out_atomic_operation(
        self,
        db: Session,
        sample_item: ItemModel,
    ):
        """Test that all-or-nothing semantics: if one item fails, all rollback"""
        # Arrange
        record = StockOutRecordModel(
            id="SO-2024-12-002",
            warehouse_code="KHO-1",
            recipient="Customer",
            purpose="Bán hàng",
            date="2024-12-01",
            items=[
                {
                    "item_id": str(sample_item.id),
                    "item_code": sample_item.sku,
                    "item_name": sample_item.name,
                    "quantity": 50,
                    "unit": "chiếc",
                    "price": 15000.0,
                    "cost": 8000.0,
                },
                {
                    # Second item that doesn't exist → will fail
                    "item_id": "9999",
                    "item_code": "INVALID-SKU",
                    "item_name": "Invalid Product",
                    "quantity": 5,
                    "unit": "chiếc",
                    "price": 10000.0,
                    "cost": 5000.0,
                },
            ],
            total_quantity=55,
            total_amount=None,
            status="completed",
        )
        db.add(record)
        db.commit()

        initial_qty = sample_item.quantity

        # Act & Assert
        with pytest.raises(HTTPException):
            await cancel_stock_out_record(db, record, "user")
        
        # Verify rollback: quantity unchanged
        db.refresh(sample_item)
        assert sample_item.quantity == initial_qty


# ============================================================================
# TEST CASES: cancel_stock_in_record
# ============================================================================

class TestCancelStockIn:
    """Test suite for cancel_stock_in_record enhancement"""

    async def test_cancel_stock_in_happy_path(
        self,
        db: Session,
        sample_item: ItemModel,
        sample_stock_in_record: StockInRecordModel,
    ):
        """Test normal cancellation of stock-in"""
        # Arrange
        initial_qty = sample_item.quantity
        expected_qty = initial_qty - 20  # Deduct what was imported

        # Act
        result = await cancel_stock_in_record(db, sample_stock_in_record, "user")

        # Assert
        assert result.status == "cancelled"
        
        # Verify quantity deducted
        db.refresh(sample_item)
        assert sample_item.quantity == expected_qty
        
        # Verify transaction created with cost metadata
        transactions = db.query(StockTransactionModel).filter(
            StockTransactionModel.voucher_id == sample_stock_in_record.id,
            StockTransactionModel.type == "out",
        ).all()
        assert len(transactions) == 1
        
        transaction = transactions[0]
        assert "Cancel stock-in" in transaction.note
        assert "5000.00/unit" in transaction.note

    async def test_cancel_stock_in_insufficient_quantity(
        self,
        db: Session,
        sample_item: ItemModel,
        sample_stock_in_record: StockInRecordModel,
    ):
        """Test that cancellation fails if insufficient stock to remove"""
        # Arrange
        sample_item.quantity = 5  # Less than import amount (20)
        db.add(sample_item)
        db.commit()

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await cancel_stock_in_record(db, sample_stock_in_record, "user")
        
        assert exc_info.value.status_code == 400
        assert "Không đủ tồn kho" in exc_info.value.detail
        assert "có 5" in exc_info.value.detail
        assert "cần trừ 20" in exc_info.value.detail

    async def test_cancel_stock_in_already_cancelled(
        self,
        db: Session,
        sample_stock_in_record: StockInRecordModel,
    ):
        """Test idempotency: cancelling already-cancelled record"""
        # Arrange
        sample_stock_in_record.status = "cancelled"
        db.add(sample_stock_in_record)
        db.commit()

        initial_qty = sample_stock_in_record.items[0]["quantity"]

        # Act
        result = await cancel_stock_in_record(db, sample_stock_in_record, "user")

        # Assert
        assert result.status == "cancelled"
        transactions = db.query(StockTransactionModel).filter(
            StockTransactionModel.voucher_id == sample_stock_in_record.id,
        ).all()
        assert len(transactions) == 0


# ============================================================================
# TEST CASES: COGS Traceability
# ============================================================================

class TestCOGSTraceability:
    """Test that COGS information is properly preserved"""

    async def test_cogs_in_cancel_stock_out_transaction(
        self,
        db: Session,
        sample_item: ItemModel,
        sample_stock_out_record: StockOutRecordModel,
    ):
        """Verify COGS metadata in stock transaction after cancel"""
        # Arrange
        cost_per_unit = 8000.0
        quantity = 10
        expected_total = cost_per_unit * quantity

        # Act
        await cancel_stock_out_record(db, sample_stock_out_record, "user")

        # Assert
        transaction = db.query(StockTransactionModel).filter(
            StockTransactionModel.voucher_id == sample_stock_out_record.id,
            StockTransactionModel.type == "in",
        ).first()

        assert transaction is not None
        expected_note = f"Original COGS: {cost_per_unit:.2f}/unit × {quantity} = {expected_total:.2f}"
        assert expected_note in transaction.note

    async def test_cost_preservation_multiple_items(
        self,
        db: Session,
        sample_item: ItemModel,
    ):
        """Test COGS preservation with multiple items in one record"""
        # Arrange
        item2 = ItemModel(
            name="Product 2",
            sku="TEST-002",
            unit="chiếc",
            price=20000.0,
            category="Electronics",
            quantity=50,
            min_stock=10,
        )
        db.add(item2)
        db.commit()
        db.refresh(item2)

        record = StockOutRecordModel(
            id="SO-2024-12-003",
            warehouse_code="KHO-1",
            recipient="Customer",
            purpose="Bán hàng",
            date="2024-12-01",
            items=[
                {
                    "item_id": str(sample_item.id),
                    "item_code": sample_item.sku,
                    "item_name": sample_item.name,
                    "quantity": 5,
                    "unit": "chiếc",
                    "price": 15000.0,
                    "cost": 7000.0,
                },
                {
                    "item_id": str(item2.id),
                    "item_code": item2.sku,
                    "item_name": item2.name,
                    "quantity": 8,
                    "unit": "chiếc",
                    "price": 25000.0,
                    "cost": 12000.0,
                },
            ],
            total_quantity=13,
            total_amount=None,
            status="completed",
        )
        db.add(record)
        db.commit()

        # Act
        await cancel_stock_out_record(db, record, "user")

        # Assert
        transactions = db.query(StockTransactionModel).filter(
            StockTransactionModel.voucher_id == record.id,
            StockTransactionModel.type == "in",
        ).order_by(StockTransactionModel.id).all()

        assert len(transactions) == 2
        
        # Item 1: 5 × 7000 = 35000
        assert "7000.00/unit × 5 = 35000.00" in transactions[0].note
        
        # Item 2: 8 × 12000 = 96000
        assert "12000.00/unit × 8 = 96000.00" in transactions[1].note


# ============================================================================
# TEST CASES: Audit Trail
# ============================================================================

class TestAuditTrail:
    """Test audit trail improvements"""

    async def test_audit_trail_includes_user_and_timestamp(
        self,
        db: Session,
        sample_stock_out_record: StockOutRecordModel,
    ):
        """Verify cancelled record includes user and timestamp in note"""
        # Arrange
        actor_user = "admin@warehouse.com"

        # Act
        result = await cancel_stock_out_record(db, sample_stock_out_record, actor_user)

        # Assert
        assert "[CANCELLED by admin@warehouse.com at" in result.note
        # Timestamp should be ISO format
        assert "T" in result.note  # ISO datetime includes 'T'
        assert "Z" in result.note or "+" in result.note  # Timezone indicator


# ============================================================================
# RUN TESTS
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
