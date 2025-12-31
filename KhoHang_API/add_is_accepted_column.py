"""
Migration script: Add is_accepted column to rt_conversation_members table
"""
import sqlite3
import os

def migrate():
    # Get database path
    app_data = os.getenv("APPDATA") or os.path.expanduser("~\\AppData\\Roaming")
    db_path = os.path.join(app_data, "NT106_QuanLyKho", "data.db")
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return
    
    print(f"📂 Database path: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(rt_conversation_members)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if "is_accepted" in columns:
            print("✅ Column 'is_accepted' already exists. Skipping migration.")
            return
        
        print("➕ Adding 'is_accepted' column...")
        
        # Add column (SQLite doesn't support adding column with foreign key in ALTER)
        cursor.execute("""
            ALTER TABLE rt_conversation_members 
            ADD COLUMN is_accepted INTEGER DEFAULT 0
        """)
        
        # Set all existing conversations to accepted (for backward compatibility)
        print("🔄 Setting existing conversations to accepted...")
        cursor.execute("""
            UPDATE rt_conversation_members 
            SET is_accepted = 1
        """)
        
        conn.commit()
        
        affected = cursor.rowcount
        print(f"✅ Migration completed! Updated {affected} rows.")
        print("   All existing conversations are now marked as 'accepted'")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
