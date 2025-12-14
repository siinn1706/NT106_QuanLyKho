"""
test_export.py - Test export service trực tiếp
Chạy: python test_export.py
"""
import sys
sys.path.insert(0, '.')

from app.export_service import VoucherExportRequest, VoucherItem, export_to_excel, export_to_pdf

# Test data
data = VoucherExportRequest(
    voucher_type='PN',  # Test Phiếu Nhập
    voucher_no='PN-000001',
    voucher_date='2025-01-08',
    partner_name='NCC Test Company',
    warehouse_code='K01',
    warehouse_location='Kho chính HCM',
    invoice_no='HD001',
    invoice_date='2025-01-07',
    tax_rate=8,  # Thuế 8%
    prepared_by='Nguyen Van A',
    receiver='Tran Van B',
    storekeeper='Le Thi C',
    director='Pham Van D',
    items=[
        VoucherItem(
            sku='SP001',
            name='San pham A',
            unit='Cai',
            qty_doc=10,
            qty_actual=10,
            unit_price=100000
        ),
        VoucherItem(
            sku='SP002',
            name='San pham B loai tot',
            unit='Hop',
            qty_doc=5,
            qty_actual=5,
            unit_price=250000
        ),
    ]
)

print("=" * 50)
print("Testing export_to_excel...")
print("=" * 50)

try:
    buffer, filename = export_to_excel(data)
    print(f"✓ Excel export successful!")
    print(f"  Filename: {filename}")
    print(f"  Size: {buffer.getbuffer().nbytes} bytes")
    
    # Save to file
    with open(f"output_{filename}", "wb") as f:
        f.write(buffer.getvalue())
    print(f"  Saved to: output_{filename}")
except Exception as e:
    print(f"✗ Excel export failed: {e}")
    import traceback
    traceback.print_exc()

print()
print("=" * 50)
print("Testing export_to_pdf...")
print("=" * 50)

try:
    buffer, filename = export_to_pdf(data)
    print(f"✓ PDF export successful!")
    print(f"  Filename: {filename}")
    print(f"  Size: {buffer.getbuffer().nbytes} bytes")
    
    # Save to file
    with open(f"output_{filename}", "wb") as f:
        f.write(buffer.getvalue())
    print(f"  Saved to: output_{filename}")
except Exception as e:
    print(f"✗ PDF export failed: {e}")
    import traceback
    traceback.print_exc()

print()
print("=" * 50)
print("Done!")
print("=" * 50)
