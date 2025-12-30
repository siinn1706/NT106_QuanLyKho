"""
Script de upload icon.png lam avatar cho chatbot
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
    """Upload icon.png tu uploads/avatars_chatbot/ lam avatar chatbot"""
    
    # Tim file icon.png trong thu muc project (KhoHang_API/uploads/avatars_chatbot)
    project_dir = Path(__file__).parent
    icon_path = project_dir / "uploads" / "avatars_chatbot" / "icon.png"
    
    if not icon_path.exists():
        print(f"[X] File khong ton tai: {icon_path}")
        return
    
    print(f"[OK] Tim thay icon.png tai: {icon_path}")
    
    # Tạo thư mục lưu avatar chatbot
    chatbot_avatar_dir = DATA_DIR / "uploads" / "chatbot"
    print(f"[DIR] DATA_DIR: {DATA_DIR}")
    print(f"[DIR] chatbot_avatar_dir: {chatbot_avatar_dir}")
    print(f"[DIR] Creating directory: {chatbot_avatar_dir}")
    chatbot_avatar_dir.mkdir(parents=True, exist_ok=True)
    print(f"[OK] Directory created/exists: {chatbot_avatar_dir.exists()}")
    
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
        
        print(f"[OK] Da convert va luu avatar tai: {filepath}")
        
        # Cập nhật database
        db = SessionLocal()
        try:
            config = db.query(ChatbotConfigModel).first()
            
            if not config:
                print("Tao moi config chatbot...")
                config = ChatbotConfigModel(
                    bot_name="N3T Assistant",
                    bot_description="Tro ly quan ly kho"
                )
                db.add(config)
            else:
                print("Cap nhat config chatbot hien tai...")
                # Xoa avatar cu neu co
                if config.avatar_url:
                    old_path = DATA_DIR / config.avatar_url.lstrip("/")
                    if old_path.exists():
                        old_path.unlink()
                        print(f"[DEL] Da xoa avatar cu: {old_path}")
            
            config.avatar_url = f"/uploads/chatbot/{filename}"
            db.commit()
            db.refresh(config)
            
            print(f"\n[OK] Hoan tat!")
            print(f"   Avatar URL: {config.avatar_url}")
            print(f"   Bot Name: {config.bot_name}")
            print(f"   Description: {config.bot_description}")
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"[ERROR] Loi: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("=" * 60)
    print("Upload Icon.png lam Avatar Chatbot")
    print("=" * 60)
    print()
    
    upload_icon_as_chatbot_avatar()
