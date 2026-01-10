"""
Migration script: Create rt_message_reactions table
Purpose: Support emoji reactions on realtime chat messages
Date: 2026-01-10
"""

from sqlalchemy import create_engine, text
from app.config import DATABASE_URL

def create_reactions_table():
    """Create rt_message_reactions table if not exists"""
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    
    with engine.begin() as conn:
        # Check if table already exists
        result = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='rt_message_reactions'"
        ))
        if result.fetchone():
            print("✅ Table rt_message_reactions already exists")
            return
        
        # Create table with composite primary key
        conn.execute(text("""
            CREATE TABLE rt_message_reactions (
                message_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                emoji TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (message_id, user_id, emoji),
                FOREIGN KEY (message_id) REFERENCES rt_messages(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """))
        
        # Create index for faster queries
        conn.execute(text("""
            CREATE INDEX idx_rt_message_reactions_message_id 
            ON rt_message_reactions(message_id)
        """))
        
        print("✅ Created table rt_message_reactions with composite PK and indexes")

if __name__ == "__main__":
    print("🚀 Creating rt_message_reactions table...")
    create_reactions_table()
    print("✅ Migration complete!")
