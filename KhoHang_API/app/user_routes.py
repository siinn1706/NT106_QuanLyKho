"""user_routes.py - User profile management endpoints"""

import os
import uuid
from pathlib import Path
from typing import Optional
from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from PIL import Image

from .database import get_db, UserModel, get_datadir
from .auth_middleware import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

# Upload directory - use DATA_DIR to ensure consistency with main.py
DATA_DIR = get_datadir()
UPLOAD_DIR = DATA_DIR / "uploads" / "avatars"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Avatar settings
MAX_AVATAR_SIZE = 800  # Max width/height in pixels
WEBP_QUALITY = 85  # WebP quality (0-100)

# ============================================
# SCHEMAS
# ============================================

class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)
    avatar_url: Optional[str] = None


# ============================================
# PROFILE ENDPOINTS
# ============================================

@router.get("/me")
def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user profile"""
    user = db.query(UserModel).filter(UserModel.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
        "role": user.role,
        "is_verified": user.is_verified,
        "has_passkey": bool(user.passkey_hash),
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat()
    }


@router.patch("/me")
def update_profile(
    data: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    user = db.query(UserModel).filter(UserModel.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields
    if data.display_name is not None:
        user.display_name = data.display_name
    
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "display_name": user.display_name,
            "avatar_url": user.avatar_url,
            "role": user.role
        }
    }


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload user avatar - converts to WebP format"""
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/bmp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only images are allowed.")
    
    # Read file contents
    contents = await file.read()
    
    # Validate file size before processing (max 10MB for upload)
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB allowed.")
    
    try:
        # Open image with PIL
        image = Image.open(BytesIO(contents))
        
        # Convert to RGB if necessary (WebP doesn't support all modes)
        if image.mode in ('RGBA', 'LA', 'P'):
            # Create white background for transparency
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize if image is too large
        if image.width > MAX_AVATAR_SIZE or image.height > MAX_AVATAR_SIZE:
            # Calculate new size maintaining aspect ratio
            ratio = min(MAX_AVATAR_SIZE / image.width, MAX_AVATAR_SIZE / image.height)
            new_size = (int(image.width * ratio), int(image.height * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        # Generate unique filename with .webp extension
        filename = f"{uuid.uuid4()}.webp"
        file_path = UPLOAD_DIR / filename
        
        # Save as WebP
        image.save(file_path, 'WEBP', quality=WEBP_QUALITY, method=6)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")
    
    # Update user avatar_url
    user = db.query(UserModel).filter(UserModel.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete old avatar if exists
    if user.avatar_url and user.avatar_url.startswith("/uploads/avatars/"):
        old_filename = user.avatar_url.split("/")[-1]
        old_file = UPLOAD_DIR / old_filename
        if old_file.exists():
            try:
                old_file.unlink()
            except:
                pass  # Ignore errors when deleting old file
    
    # Update URL
    avatar_url = f"/uploads/avatars/{filename}"
    user.avatar_url = avatar_url
    db.commit()
    
    return {
        "message": "Avatar uploaded successfully",
        "avatar_url": avatar_url
    }


@router.delete("/me/avatar")
def delete_avatar(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user avatar"""
    user = db.query(UserModel).filter(UserModel.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete file if exists
    if user.avatar_url and user.avatar_url.startswith("/uploads/avatars/"):
        file_path = Path(user.avatar_url.lstrip("/"))
        if file_path.exists():
            file_path.unlink()
    
    user.avatar_url = None
    db.commit()
    
    return {"message": "Avatar deleted successfully"}
