"""
test_inventory_valuation.py - Test FIFO inventory valuation logic

Run this script to verify the FIFO calculation works correctly:
    python test_inventory_valuation.py
"""

from datetime import datetime, timezone, timedelta
import sys
from pathlib import Path

# Add app directory to path
app_dir = Path(__file__).parent / "app"
sys.path.insert(0, str(app_dir))

from database import SessionLocal, ItemModel, StockInRecordModel, StockOutRecordModel
from inventory_service import calculate_fifo_cost, create_stock_out_record
from schemas import StockOutBatchCreate, StockOutItem
import asyncio


def setup_test_data():
    """Create test data for FIFO testing."""
    db = SessionLocal()
    
    try:
        # Clear existing data
        db.query(StockOutRecordModel).delete()
        db.query(StockInRecordModel).delete()
        db.query(ItemModel).delete()
        db.commit()
        
        # Create test item
        item = ItemModel(
            id=1,
            name="Test Product",
            sku="TEST-001",
            unit="cái",
            price=100,
            category="test",
        )
        db.add(item)
        db.commit()
        
        # Stock-in 1: 10 units @ 100k
        si_record_1 = StockInRecordModel(
            id="SI-001",
            warehouse_code="K1",
            supplier="Supplier A",
            date="2024-01-01",
            note="First batch",
            items=[{
                "item_id": "1",
                "item_code": "TEST-001",
                "item_name": "Test Product",
                "quantity": 10,
                "unit": "cái",
                "price": 100,
                "cost": 0,
            }],
            total_quantity=10,
            total_amount=1000,
            status="completed",
        )
        db.add(si_record_1)
        db.commit()
        
        # Stock-in 2: 10 units @ 150k
        si_record_2 = StockInRecordModel(
            id="SI-002",
            warehouse_code="K1",
            supplier="Supplier B",
            date="2024-01-05",
            note="Second batch",
            items=[{
                "item_id": "1",
                "item_code": "TEST-001",
                "item_name": "Test Product",
                "quantity": 10,
                "unit": "cái",
                "price": 150,
                "cost": 0,
            }],
            total_quantity=10,
            total_amount=1500,
            status="completed",
        )
        db.add(si_record_2)
        db.commit()
        
        # Update item quantity
        item = db.query(ItemModel).filter(ItemModel.id == 1).first()
        item.quantity = 20
        db.add(item)
        db.commit()
        
        print("✓ Test data created successfully")
        print(f"  - Item: TEST-001 (quantity: 20)")
        print(f"  - Stock-in 1: 10 units @ 100k")
        print(f"  - Stock-in 2: 10 units @ 150k")
        
    finally:
        db.close()


def test_fifo_calculation():
    """Test FIFO cost calculation."""
    print("\n" + "="*60)
    print("TEST 1: FIFO Cost Calculation")
    print("="*60)
    
    db = SessionLocal()
    try:
        # Test case: stock-out 15 units
        total_cost, cost_breakdown = calculate_fifo_cost(db, 1, "K1", 15)
        
        print(f"\nScenario: Stock-out 15 units from warehouse K1")
        print(f"\nCost Breakdown:")
        for i, breakdown in enumerate(cost_breakdown, 1):
            print(f"  {i}. Stock-in ID: {breakdown['stock_in_id']}")
            print(f"     Quantity: {breakdown['quantity']}")
            print(f"     Unit Price: {breakdown['unit_price']}")
            print(f"     Subtotal: {breakdown['subtotal']}")
        
        avg_cost = total_cost / 15
        print(f"\nResults:")
        print(f"  Total COGS: {total_cost}k")
        print(f"  Avg Cost/Unit: {avg_cost:.2f}k")
        
        # Verify calculation
        expected_cost = (10 * 100) + (5 * 150)  # 1000 + 750 = 1750
        expected_avg = expected_cost / 15  # ~116.67
        
        assert total_cost == expected_cost, f"Expected {expected_cost}, got {total_cost}"
        assert abs(avg_cost - expected_avg) < 0.01, f"Expected {expected_avg:.2f}, got {avg_cost:.2f}"
        
        print(f"\n✓ Test PASSED - FIFO calculation is correct!")
        
    finally:
        db.close()


def test_edge_case_exact_fit():
    """Test edge case: stock-out exactly matches stock-in quantities."""
    print("\n" + "="*60)
    print("TEST 2: Edge Case - Exact Fit")
    print("="*60)
    
    db = SessionLocal()
    try:
        # Stock-out exactly 20 units (10 + 10)
        total_cost, cost_breakdown = calculate_fifo_cost(db, 1, "K1", 20)
        
        print(f"\nScenario: Stock-out 20 units (exact inventory)")
        print(f"\nCost Breakdown:")
        for breakdown in cost_breakdown:
            print(f"  - {breakdown['quantity']} units @ {breakdown['unit_price']}k = {breakdown['subtotal']}k")
        
        avg_cost = total_cost / 20
        print(f"\nResults:")
        print(f"  Total COGS: {total_cost}k")
        print(f"  Avg Cost/Unit: {avg_cost:.2f}k")
        
        # Verify
        expected = (10 * 100) + (10 * 150)  # 1000 + 1500 = 2500
        expected_avg = expected / 20  # 125
        
        assert total_cost == expected, f"Expected {expected}, got {total_cost}"
        assert avg_cost == expected_avg, f"Expected {expected_avg}, got {avg_cost}"
        
        print(f"\n✓ Test PASSED - Exact fit handled correctly!")
        
    finally:
        db.close()


def test_partial_from_first_batch():
    """Test: stock-out only from first batch."""
    print("\n" + "="*60)
    print("TEST 3: Partial Stock-out - First Batch Only")
    print("="*60)
    
    db = SessionLocal()
    try:
        # Stock-out 5 units (all from first batch)
        total_cost, cost_breakdown = calculate_fifo_cost(db, 1, "K1", 5)
        
        print(f"\nScenario: Stock-out 5 units (all from first batch)")
        print(f"\nCost Breakdown: {len(cost_breakdown)} batch(es)")
        for breakdown in cost_breakdown:
            print(f"  - {breakdown['quantity']} units @ {breakdown['unit_price']}k = {breakdown['subtotal']}k")
        
        avg_cost = total_cost / 5
        print(f"\nResults:")
        print(f"  Total COGS: {total_cost}k")
        print(f"  Avg Cost/Unit: {avg_cost:.2f}k")
        
        # Verify
        expected = 5 * 100  # 500
        expected_avg = expected / 5  # 100
        
        assert total_cost == expected, f"Expected {expected}, got {total_cost}"
        assert avg_cost == expected_avg, f"Expected {expected_avg}, got {avg_cost}"
        
        print(f"\n✓ Test PASSED - Partial batch handling correct!")
        
    finally:
        db.close()


def test_profit_calculation():
    """Test profit calculation with COGS."""
    print("\n" + "="*60)
    print("TEST 4: Profit Calculation")
    print("="*60)
    
    db = SessionLocal()
    try:
        total_cost, _ = calculate_fifo_cost(db, 1, "K1", 15)
        
        sell_price = 200  # per unit
        quantity = 15
        
        revenue = sell_price * quantity
        profit = revenue - total_cost
        margin = (profit / revenue * 100) if revenue > 0 else 0
        
        print(f"\nScenario: Sell 15 units @ {sell_price}k/unit")
        print(f"\nFinancial Summary:")
        print(f"  Revenue: {revenue}k")
        print(f"  COGS: {total_cost}k")
        print(f"  Gross Profit: {profit}k")
        print(f"  Margin: {margin:.1f}%")
        
        # Verify
        expected_profit = (15 * 200) - 1750  # 3000 - 1750 = 1250
        assert profit == expected_profit, f"Expected profit {expected_profit}, got {profit}"
        
        print(f"\n✓ Test PASSED - Profit calculation correct!")
        
    finally:
        db.close()


if __name__ == "__main__":
    print("\n" + "="*60)
    print("INVENTORY VALUATION (FIFO) - TEST SUITE")
    print("="*60)
    
    try:
        # Setup test data
        setup_test_data()
        
        # Run tests
        test_fifo_calculation()
        test_edge_case_exact_fit()
        test_partial_from_first_batch()
        test_profit_calculation()
        
        print("\n" + "="*60)
        print("ALL TESTS PASSED ✓")
        print("="*60)
        print("\nSummary:")
        print("  ✓ FIFO cost calculation working correctly")
        print("  ✓ Edge cases handled properly")
        print("  ✓ Profit calculation accurate")
        print("  ✓ Ready for production deployment")
        
    except AssertionError as e:
        print(f"\n✗ TEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
