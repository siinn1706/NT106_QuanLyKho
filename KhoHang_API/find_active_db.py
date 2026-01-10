"""Check which database file has rt_messages table"""
import sqlite3
from pathlib import Path

db_paths = [
    r"C:\Users\Siinn\Downloads\NT106_QuanLyKho\KhoHang_API\data.db",
    r"C:\Users\Siinn\Downloads\NT106_QuanLyKho\KhoHang_API\data\data.db"
]

for db_path in db_paths:
    if not Path(db_path).exists():
        print(f"❌ {db_path} - NOT FOUND")
        continue
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'rt_%';")
        tables = [row[0] for row in cursor.fetchall()]
        
        if tables:
            print(f"✅ {db_path}")
            print(f"   RT Tables: {', '.join(tables)}")
            
            # Check message count
            if 'rt_messages' in tables:
                cursor.execute("SELECT COUNT(*) FROM rt_messages;")
                count = cursor.fetchone()[0]
                print(f"   Message count: {count}")
                
                # Check latest timestamp
                if count > 0:
                    cursor.execute("SELECT created_at FROM rt_messages ORDER BY created_at DESC LIMIT 1;")
                    latest = cursor.fetchone()[0]
                    print(f"   Latest timestamp: {latest}")
        else:
            print(f"⚠️  {db_path} - No RT tables found")
        
        conn.close()
        print()
    except Exception as e:
        print(f"❌ {db_path} - Error: {e}\n")
