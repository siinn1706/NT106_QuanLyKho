"""
Migration script: Migrate existing bot chat messages to per-user conversations
Purpose: Update conversation_id from "bot" to "bot_{user_id}"
Date: 2026-01-10
"""

from sqlalchemy import create_engine, text
from app.config import DATABASE_URL

def migrate_bot_conversations():
    """Migrate existing bot chat messages to per-user conversation IDs"""
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    
    with engine.begin() as conn:
        # Check if chat_messages table exists
        result = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='chat_messages'"
        ))
        if not result.fetchone():
            print("✅ Table chat_messages does not exist - nothing to migrate")
            return
        
        # Get all unique sender_ids from messages with conversation_id='bot'
        result = conn.execute(text("""
            SELECT DISTINCT sender FROM chat_messages 
            WHERE conversation_id = 'bot' AND sender IN ('user', 'agent')
        """))
        
        senders = result.fetchall()
        if not senders:
            print("✅ No messages with conversation_id='bot' found - nothing to migrate")
            return
        
        print(f"⚠️  Found messages with generic 'bot' conversation_id")
        print("⚠️  Cannot automatically determine user ownership without user context")
        print("⚠️  OPTIONS:")
        print("   1. Delete all existing bot messages: DELETE FROM chat_messages WHERE conversation_id='bot'")
        print("   2. Manually update per user if you know the user_id")
        print("   3. Leave as-is (old messages won't show in new system)")
        
        # For safety, we'll just report - not auto-migrate
        count_result = conn.execute(text(
            "SELECT COUNT(*) as cnt FROM chat_messages WHERE conversation_id = 'bot'"
        ))
        count = count_result.fetchone()[0]
        print(f"\n📊 Total messages with conversation_id='bot': {count}")
        print("\n✅ Migration check complete - no automatic changes made")
        print("💡 TIP: New messages will automatically use bot_{user_id} format")

if __name__ == "__main__":
    print("🚀 Checking bot conversation migration...")
    migrate_bot_conversations()
