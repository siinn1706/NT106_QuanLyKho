"""Migration: Add display_name column to users table"""

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

def migrate():
    """Add display_name column to users table if it doesn't exist"""
    DATA_DIR = get_datadir()
    DB_FILE = DATA_DIR / "data.db"
    
    print(f"📂 Database: {DB_FILE}")
    
    if not DB_FILE.exists():
        print("❌ Database file not found!")
        return
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if "display_name" in columns:
            print("✅ Column 'display_name' already exists")
        else:
            print("🔄 Adding 'display_name' column...")
            cursor.execute("ALTER TABLE users ADD COLUMN display_name TEXT")
            
            # Set default values: display_name = username
            cursor.execute("UPDATE users SET display_name = username WHERE display_name IS NULL")
            
            conn.commit()
            print("✅ Column 'display_name' added successfully")
        
        # Show current users
        cursor.execute("SELECT username, email, display_name FROM users")
        users = cursor.fetchall()
        if users:
            print(f"\n📋 Current users ({len(users)}):")
            for user in users:
                print(f"  - {user[0]} (email: {user[1]}, display_name: {user[2]})")
        else:
            print("\n📋 No users in database yet")
            
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 50)
    print("  Database Migration: Add display_name column")
    print("=" * 50)
    migrate()
    print("\n✨ Migration complete!")
