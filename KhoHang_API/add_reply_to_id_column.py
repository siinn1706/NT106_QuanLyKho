"""
Add reply_to_id column to rt_messages table
Allows messages to reference the message they are replying to
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "data.db"

def add_reply_to_id_column():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(rt_messages)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if "reply_to_id" in columns:
            print("✓ Column 'reply_to_id' already exists in rt_messages table")
            return
        
        # Add reply_to_id column
        print("Adding 'reply_to_id' column to rt_messages table...")
        cursor.execute("""
            ALTER TABLE rt_messages 
            ADD COLUMN reply_to_id TEXT REFERENCES rt_messages(id)
        """)
        
        conn.commit()
        print("✓ Successfully added 'reply_to_id' column")
        
        # Verify
        cursor.execute("PRAGMA table_info(rt_messages)")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"✓ Current columns: {columns}")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    add_reply_to_id_column()
