"""Check database schema and compare with models"""

import sqlite3
from pathlib import Path
import os
import sys

def get_datadir() -> Path:
    """Get data directory path"""
    home = Path.home()
    app_name = "NT106_QuanLyKho"

    if sys.platform == "win32":
        base_path = Path(os.getenv("APPDATA", home / "AppData" / "Roaming"))
    elif sys.platform == "darwin":
        base_path = home / "Library" / "Application Support"
    else:
        base_path = home / ".local" / "share"
    
    full_path = base_path / app_name
    full_path.mkdir(parents=True, exist_ok=True)
    return full_path

def check_schema():
    """Check users table schema"""
    DATA_DIR = get_datadir()
    DB_FILE = DATA_DIR / "data.db"
    
    print(f"📂 Database: {DB_FILE}")
    
    if not DB_FILE.exists():
        print("❌ Database file not found!")
        return
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        print("\n" + "=" * 60)
        print("  USERS TABLE SCHEMA")
        print("=" * 60)
        
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        
        print(f"\n{'CID':<5} {'Name':<20} {'Type':<15} {'NotNull':<10} {'Default':<15}")
        print("-" * 65)
        for col in columns:
            cid, name, type_, notnull, default, pk = col
            print(f"{cid:<5} {name:<20} {type_:<15} {notnull:<10} {str(default):<15}")
        
        print("\n" + "=" * 60)
        print("  USERS DATA")
        print("=" * 60)
        
        cursor.execute("SELECT id, username, email, display_name, role, is_verified FROM users")
        users = cursor.fetchall()
        
        if users:
            print(f"\nFound {len(users)} user(s):\n")
            for user in users:
                print(f"ID: {user[0]}")
                print(f"  Username: {user[1]}")
                print(f"  Email: {user[2]}")
                print(f"  Display Name: {user[3]}")
                print(f"  Role: {user[4]}")
                print(f"  Verified: {user[5]}")
                print()
        else:
            print("\n📋 No users in database")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_schema()
