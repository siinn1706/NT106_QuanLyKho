"""
Script để upload icon.png làm avatar cho chatbot
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import ChatbotConfigModel, get_datadir
from PIL import Image
import shutil
import uuid

# Setup database
DATA_DIR = get_datadir()
DB_FILE = DATA_DIR / "data.db"
DATABASE_URL = f"sqlite:///{DB_FILE}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

def upload_icon_as_chatbot_avatar():
    """Upload icon.png từ UI_Desktop/src/resources/ làm avatar chatbot"""
    
    # Tìm file icon.png
    project_root = Path(__file__).parent.parent  # Lên 1 cấp từ KhoHang_API
    icon_path = project_root / "UI_Desktop" / "src" / "resources" / "icon.png"
    
    if not icon_path.exists():
        print(f"❌ File không tồn tại: {icon_path}")
        return
    
    print(f"✅ Tìm thấy icon.png tại: {icon_path}")
    
    # Tạo thư mục lưu avatar chatbot
    chatbot_avatar_dir = DATA_DIR / "uploads" / "chatbot"
    print(f"📁 DATA_DIR: {DATA_DIR}")
    print(f"📁 chatbot_avatar_dir: {chatbot_avatar_dir}")
    print(f"📁 Creating directory: {chatbot_avatar_dir}")
    chatbot_avatar_dir.mkdir(parents=True, exist_ok=True)
    print(f"✅ Directory created/exists: {chatbot_avatar_dir.exists()}")
    
    # Convert sang WebP
    try:
        img = Image.open(icon_path)
        
        # Convert RGBA to RGB nếu cần
        if img.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            background.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
            img = background
        
        # Resize giữ tỷ lệ (max 800px)
        MAX_SIZE = 800
        if img.width > MAX_SIZE or img.height > MAX_SIZE:
            img.thumbnail((MAX_SIZE, MAX_SIZE), Image.Resampling.LANCZOS)
        
        # Lưu WebP
        filename = f"chatbot_avatar_{uuid.uuid4().hex}.webp"
        filepath = chatbot_avatar_dir / filename
        img.save(filepath, "WEBP", quality=85, method=6)
        
        print(f"✅ Đã convert và lưu avatar tại: {filepath}")
        
        # Cập nhật database
        db = SessionLocal()
        try:
            config = db.query(ChatbotConfigModel).first()
            
            if not config:
                print("Tạo mới config chatbot...")
                config = ChatbotConfigModel(
                    bot_name="N3T Assistant",
                    bot_description="Trợ lý quản lý kho"
                )
                db.add(config)
            else:
                print("Cập nhật config chatbot hiện tại...")
                # Xóa avatar cũ nếu có
                if config.avatar_url:
                    old_path = DATA_DIR / config.avatar_url.lstrip("/")
                    if old_path.exists():
                        old_path.unlink()
                        print(f"🗑️  Đã xóa avatar cũ: {old_path}")
            
            config.avatar_url = f"/uploads/chatbot/{filename}"
            db.commit()
            db.refresh(config)
            
            print(f"\n✅ Hoàn tất!")
            print(f"   Avatar URL: {config.avatar_url}")
            print(f"   Bot Name: {config.bot_name}")
            print(f"   Description: {config.bot_description}")
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("=" * 60)
    print("Upload Icon.png làm Avatar Chatbot")
    print("=" * 60)
    print()
    
    upload_icon_as_chatbot_avatar()
