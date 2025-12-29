"""
Migration Script: Chuyển đổi WarehouseManager từ 'name' sang 'email'

Script này sẽ:
1. Đọc tất cả warehouses trong database
2. Với mỗi manager có field 'name', chuyển thành 'email'
3. Nếu 'name' không phải email, sẽ bỏ qua hoặc để giá trị mặc định

Chạy script này MỘT LẦN sau khi deploy code mới.
"""

import sys
from pathlib import Path

# Add app directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import get_db, WarehouseModel
import re

def is_valid_email(email: str) -> bool:
    """Check if string is a valid email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def migrate_warehouse_managers():
    """Migrate warehouse managers from 'name' to 'email' field"""
    db = next(get_db())
    
    try:
        warehouses = db.query(WarehouseModel).all()
        migrated_count = 0
        skipped_count = 0
        
        print(f"Found {len(warehouses)} warehouses to check...")
        
        for warehouse in warehouses:
            if not warehouse.managers:
                continue
                
            updated = False
            new_managers = []
            
            for manager in warehouse.managers:
                # Check if manager has 'name' field (old format)
                if 'name' in manager and 'email' not in manager:
                    name_value = manager['name']
                    
                    # If name looks like email, use it as email
                    if is_valid_email(name_value):
                        new_managers.append({
                            'email': name_value,
                            'position': manager.get('position', '')
                        })
                        updated = True
                        print(f"  ✓ Warehouse '{warehouse.code}': Converted name '{name_value}' to email")
                    else:
                        # Name is not an email - skip this manager or use placeholder
                        print(f"  ⚠ Warehouse '{warehouse.code}': Skipped invalid email '{name_value}'")
                        skipped_count += 1
                        # Optionally add with a placeholder email:
                        # new_managers.append({
                        #     'email': f'placeholder_{warehouse.id}_{len(new_managers)}@example.com',
                        #     'position': manager.get('position', '')
                        # })
                
                # Manager already has 'email' field (new format)
                elif 'email' in manager:
                    new_managers.append({
                        'email': manager['email'],
                        'position': manager.get('position', '')
                    })
            
            if updated:
                warehouse.managers = new_managers
                migrated_count += 1
        
        # Commit changes
        db.commit()
        
        print(f"\n✅ Migration completed!")
        print(f"   - Migrated: {migrated_count} warehouses")
        print(f"   - Skipped: {skipped_count} invalid managers")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Warehouse Manager Migration: name -> email")
    print("=" * 60)
    migrate_warehouse_managers()

