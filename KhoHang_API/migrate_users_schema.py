"""Complete migration: Update users table to new schema"""

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

def migrate_users_table():
    """Migrate users table to new schema"""
    DATA_DIR = get_datadir()
    DB_FILE = DATA_DIR / "data.db"
    
    print(f"📂 Database: {DB_FILE}")
    
    if not DB_FILE.exists():
        print("❌ Database file not found!")
        return
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        # Get current schema
        cursor.execute("PRAGMA table_info(users)")
        columns = {row[1]: row for row in cursor.fetchall()}
        
        print("\n🔍 Current columns:", list(columns.keys()))
        
        # Backup existing data
        cursor.execute("SELECT * FROM users")
        existing_users = cursor.fetchall()
        cursor.execute("PRAGMA table_info(users)")
        col_names = [row[1] for row in cursor.fetchall()]
        
        print(f"\n📦 Backing up {len(existing_users)} user(s)...")
        
        # Drop and recreate table with new schema
        print("\n🔨 Recreating users table with new schema...")
        cursor.execute("DROP TABLE IF EXISTS users_old")
        cursor.execute("ALTER TABLE users RENAME TO users_old")
        
        # Create new table with correct schema
        cursor.execute("""
            CREATE TABLE users (
                id VARCHAR PRIMARY KEY NOT NULL,
                username VARCHAR UNIQUE NOT NULL,
                email VARCHAR UNIQUE NOT NULL,
                display_name VARCHAR,
                avatar_url VARCHAR,
                password_hash VARCHAR NOT NULL,
                passkey_hash VARCHAR,
                role VARCHAR DEFAULT 'staff',
                is_verified BOOLEAN DEFAULT 0,
                created_at DATETIME,
                updated_at DATETIME
            )
        """)
        
        # Migrate data
        print("\n🔄 Migrating user data...")
        for user in existing_users:
            user_dict = dict(zip(col_names, user))
            
            # Map old columns to new columns
            id_val = user_dict.get('id', '')
            email_val = user_dict.get('email', '')
            # Use 'name' or 'username' from old schema, fallback to email prefix
            username_val = user_dict.get('username') or user_dict.get('name') or email_val.split('@')[0]
            display_name_val = user_dict.get('display_name') or user_dict.get('name') or username_val
            avatar_url_val = user_dict.get('avatar_url') or user_dict.get('avatar')
            # For password_hash, if it doesn't exist, set a placeholder (user will need to reset)
            password_hash_val = user_dict.get('password_hash', 'NEEDS_RESET')
            passkey_hash_val = user_dict.get('passkey_hash')
            role_val = user_dict.get('role', 'staff')
            is_verified_val = user_dict.get('is_verified', 0)
            created_at_val = user_dict.get('created_at')
            updated_at_val = user_dict.get('updated_at')
            
            cursor.execute("""
                INSERT INTO users (
                    id, username, email, display_name, avatar_url, 
                    password_hash, passkey_hash, role, is_verified, 
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                id_val, username_val, email_val, display_name_val, avatar_url_val,
                password_hash_val, passkey_hash_val, role_val, is_verified_val,
                created_at_val, updated_at_val
            ))
            
            print(f"  ✓ Migrated user: {username_val} ({email_val})")
        
        # Drop old table
        cursor.execute("DROP TABLE users_old")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
        # Show migrated users
        cursor.execute("SELECT id, username, email, display_name, role, is_verified FROM users")
        users = cursor.fetchall()
        
        if users:
            print(f"\n📋 Migrated users ({len(users)}):")
            for user in users:
                print(f"\n  ID: {user[0]}")
                print(f"    Username: {user[1]}")
                print(f"    Email: {user[2]}")
                print(f"    Display Name: {user[3]}")
                print(f"    Role: {user[4]}")
                print(f"    Verified: {user[5]}")
            
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("  USERS TABLE SCHEMA MIGRATION")
    print("=" * 60)
    migrate_users_table()
    print("\n✨ Done!")
