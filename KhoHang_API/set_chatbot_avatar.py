# set_chatbot_avatar.py
"""Script để set avatar URL cho chatbot trong database"""

import sys
sys.path.insert(0, '.')

from app.database import get_db, ChatbotConfigModel

def set_avatar():
    db = next(get_db())
    
    config = db.query(ChatbotConfigModel).first()
    
    if config:
        config.avatar_url = "/uploads/chatbot/chatbot_avatar.png"
        db.commit()
        print(f"✅ Updated avatar_url to: {config.avatar_url}")
    else:
        # Tạo config mới với avatar
        config = ChatbotConfigModel(
            bot_name="N3T Assistant",
            bot_description="Trợ lý quản lý kho",
            avatar_url="/uploads/chatbot/chatbot_avatar.png"
        )
        db.add(config)
        db.commit()
        print(f"✅ Created new config with avatar_url: {config.avatar_url}")
    
    db.close()

if __name__ == "__main__":
    set_avatar()
