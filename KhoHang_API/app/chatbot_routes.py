# app/chatbot_routes.py
"""API endpoints cho cấu hình chatbot"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pathlib import Path
from PIL import Image
import io
import uuid
from typing import Optional

from app.database import get_db, ChatbotConfigModel, get_datadir
from app.auth_middleware import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])

# Thư mục lưu avatar chatbot
DATA_DIR = get_datadir()
CHATBOT_AVATAR_DIR = DATA_DIR / "uploads" / "chatbot"
CHATBOT_AVATAR_DIR.mkdir(parents=True, exist_ok=True)

MAX_AVATAR_SIZE = 800  # px
WEBP_QUALITY = 85

class ChatbotConfigResponse(BaseModel):
    avatar_url: Optional[str]
    bot_name: str
    bot_description: str

@router.get("/config", response_model=ChatbotConfigResponse)
def get_chatbot_config(db: Session = Depends(get_db)):
    """Lấy cấu hình chatbot (avatar, tên, mô tả)"""
    config = db.query(ChatbotConfigModel).first()
    
    if not config:
        # Tạo config mặc định nếu chưa có
        config = ChatbotConfigModel(
            bot_name="N3T Assistant",
            bot_description="Trợ lý quản lý kho",
            avatar_url=None
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    
    return ChatbotConfigResponse(
        avatar_url=config.avatar_url,
        bot_name=config.bot_name,
        bot_description=config.bot_description
    )

@router.post("/avatar")
async def upload_chatbot_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Upload avatar cho chatbot (chỉ admin) - lưu file gốc không convert"""
    
    # Kiểm tra quyền admin
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admin can change chatbot avatar")
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Lấy extension từ filename gốc
        original_filename = file.filename or "avatar.png"
        ext = Path(original_filename).suffix.lower()
        if not ext:
            ext = ".png"
        
        # Lưu file gốc không convert
        filename = f"chatbot_avatar_{uuid.uuid4().hex}{ext}"
        filepath = CHATBOT_AVATAR_DIR / filename
        
        # Đọc và lưu file
        contents = await file.read()
        with open(filepath, "wb") as f:
            f.write(contents)
        
        # Cập nhật database
        config = db.query(ChatbotConfigModel).first()
        if not config:
            config = ChatbotConfigModel(
                bot_name="N3T Assistant",
                bot_description="Trợ lý quản lý kho"
            )
            db.add(config)
        
        # Xóa avatar cũ nếu có
        if config.avatar_url:
            old_path = DATA_DIR / config.avatar_url.lstrip("/")
            if old_path.exists():
                old_path.unlink()
        
        # Cập nhật đường dẫn mới
        config.avatar_url = f"/uploads/chatbot/{filename}"
        db.commit()
        db.refresh(config)
        
        return {
            "success": True,
            "avatar_url": config.avatar_url,
            "message": "Chatbot avatar updated successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading avatar: {str(e)}")

@router.put("/config")
def update_chatbot_config(
    bot_name: Optional[str] = None,
    bot_description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Cập nhật tên và mô tả chatbot (chỉ admin)"""
    
    # Kiểm tra quyền admin
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admin can change chatbot config")
    
    config = db.query(ChatbotConfigModel).first()
    if not config:
        config = ChatbotConfigModel()
        db.add(config)
    
    if bot_name is not None:
        config.bot_name = bot_name
    if bot_description is not None:
        config.bot_description = bot_description
    
    db.commit()
    db.refresh(config)
    
    return {
        "success": True,
        "bot_name": config.bot_name,
        "bot_description": config.bot_description
    }
