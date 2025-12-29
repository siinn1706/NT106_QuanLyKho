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

# Thư mục lưu file đính kèm (dùng chung cho chatbot và tin nhắn người dùng)
ATTACHMENTS_DIR = DATA_DIR / "uploads" / "attachments"
ATTACHMENTS_DIR.mkdir(parents=True, exist_ok=True)

MAX_AVATAR_SIZE = 800  # px
WEBP_QUALITY = 85
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

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


@router.post("/upload")
async def upload_attachment(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload file đính kèm (dùng chung cho chatbot và tin nhắn người dùng).
    
    Endpoint này được Frontend gọi khi người dùng upload ảnh/file trong bất kỳ 
    cuộc hội thoại nào (với Bot hoặc với người khác).
    
    Returns:
        {
            "file_url": "/uploads/attachments/...",
            "file_name": "original_name.ext",
            "file_type": "image/png",
            "file_size": 12345
        }
    """
    try:
        # Đọc file content
        contents = await file.read()
        file_size = len(contents)
        
        # Kiểm tra kích thước file
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400, 
                detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024*1024):.1f}MB"
            )
        
        # Lấy thông tin file gốc
        original_filename = file.filename or "file"
        file_type = file.content_type or "application/octet-stream"
        
        # Lấy extension từ filename gốc
        ext = Path(original_filename).suffix.lower()
        if not ext:
            # Nếu không có extension, thử đoán từ content_type
            if file_type.startswith("image/"):
                ext = ".jpg"
            elif file_type.startswith("application/pdf"):
                ext = ".pdf"
            else:
                ext = ".bin"
        
        # Tạo tên file duy nhất với UUID
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        filepath = ATTACHMENTS_DIR / unique_filename
        
        # Lưu file
        with open(filepath, "wb") as f:
            f.write(contents)
        
        # Tạo URL để truy cập file
        file_url = f"/uploads/attachments/{unique_filename}"
        
        return {
            "file_url": file_url,
            "file_name": original_filename,
            "file_type": file_type,
            "file_size": file_size
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")
