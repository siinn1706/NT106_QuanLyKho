# app/chatbot_routes.py
"""API endpoints cho cấu hình chatbot"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pathlib import Path
from PIL import Image
import io
import uuid
import aiofiles
from typing import Optional

from app.database import get_db, ChatbotConfigModel, get_datadir
from app.auth_middleware import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])

# Thư mục lưu avatar chatbot
DATA_DIR = get_datadir()
CHATBOT_AVATAR_DIR = DATA_DIR / "uploads" / "chatbot"
CHATBOT_AVATAR_DIR.mkdir(parents=True, exist_ok=True)

CHAT_FILES_DIR = DATA_DIR / "uploads" / "chat_files"
CHAT_FILES_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.zip', '.rar'}
MAX_FILE_SIZE = 10 * 1024 * 1024

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


class FileUploadResponse(BaseModel):
    file_id: str
    url: str
    name: str
    size: int
    mime_type: str


@router.post("/files", response_model=FileUploadResponse)
async def upload_chatbot_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    API: POST /api/chatbot/files
    Purpose: Upload file attachment for chatbot
    Request (JSON): multipart/form-data with 'file' field
    Response (JSON) [200]: { file_id, url, name, size, mime_type }
    Response Errors:
    - 400: { "detail": "Invalid file type or size" }
    - 401: { "detail": "Unauthorized" }
    - 413: { "detail": "File too large" }
    - 500: { "detail": "Internal Server Error" }
    Notes: Max 10MB, allowed exts: png/jpg/jpeg/gif/webp/pdf/doc/docx/xls/xlsx/txt/zip/rar
    """
    if not file.filename:
        raise HTTPException(400, "Filename required")
    
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
    
    file_id = str(uuid.uuid4())
    safe_filename = f"{file_id}{ext}"
    file_path = CHAT_FILES_DIR / safe_filename
    
    size = 0
    async with aiofiles.open(file_path, 'wb') as f:
        while chunk := await file.read(8192):
            size += len(chunk)
            if size > MAX_FILE_SIZE:
                await f.close()
                file_path.unlink(missing_ok=True)
                raise HTTPException(413, "File too large (max 10MB)")
            await f.write(chunk)
    
    print(f"[Chatbot Upload] File saved: {file_path} (exists: {file_path.exists()})")
    
    url = f"/uploads/chat_files/{safe_filename}"
    
    return FileUploadResponse(
        file_id=file_id,
        url=url,
        name=file.filename,
        size=size,
        mime_type=file.content_type or "application/octet-stream"
    )
