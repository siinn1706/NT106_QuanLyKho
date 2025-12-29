"""auth_routes.py - Authentication endpoints"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field

from .database import get_db, UserModel, EmailOtpModel
from .security import (
    hash_password, verify_password,
    generate_otp_code, hash_otp, verify_otp,
    create_access_token, validate_username, normalize_username,
    validate_password
)
from .email_service import send_otp_email, send_welcome_email
from .auth_middleware import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ============================================
# SCHEMAS
# ============================================

class RegisterRequestOTP(BaseModel):
    username: str = Field(..., min_length=3, max_length=24)
    email: EmailStr
    display_name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)
    avatar_url: Optional[str] = None

class RegisterConfirm(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class PasswordResetRequestOTP(BaseModel):
    username_or_email: str

class PasswordResetConfirm(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=6, max_length=100)

class PasskeyChangeRequestOTP(BaseModel):
    pass  # Authenticated user, no extra data needed

class PasskeyChangeConfirm(BaseModel):
    otp: str = Field(..., min_length=6, max_length=6)
    new_passkey: str = Field(..., min_length=4, max_length=50)


# ============================================
# HELPER FUNCTIONS
# ============================================

def cleanup_expired_otps(db: Session, email: str, purpose: str):
    """Delete expired OTPs"""
    now = datetime.now(timezone.utc)
    db.query(EmailOtpModel).filter(
        EmailOtpModel.email == email,
        EmailOtpModel.purpose == purpose,
        EmailOtpModel.expires_at < now
    ).delete()
    db.commit()


def get_valid_otp(db: Session, email: str, purpose: str) -> Optional[EmailOtpModel]:
    """Get valid (non-expired, non-consumed) OTP"""
    cleanup_expired_otps(db, email, purpose)
    now = datetime.now(timezone.utc)
    
    return db.query(EmailOtpModel).filter(
        EmailOtpModel.email == email,
        EmailOtpModel.purpose == purpose,
        EmailOtpModel.expires_at > now,
        EmailOtpModel.consumed_at == None
    ).order_by(EmailOtpModel.created_at.desc()).first()


# ============================================
# REGISTER ENDPOINTS
# ============================================

@router.post("/register/request-otp")
def register_request_otp(data: RegisterRequestOTP, db: Session = Depends(get_db)):
    """Request OTP for registration"""
    
    # Normalize username
    username = normalize_username(data.username)
    
    # Validate username format
    if not validate_username(username):
        raise HTTPException(
            status_code=400,
            detail="Username must be 3-24 characters, lowercase letters, numbers, dots, underscores, hyphens only"
        )
    
    # Check if username exists
    if db.query(UserModel).filter(UserModel.username == username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if email exists
    if db.query(UserModel).filter(UserModel.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Check existing valid OTP
    existing_otp = get_valid_otp(db, data.email, "register")
    if existing_otp:
        # Check rate limiting (60 seconds between resends)
        time_since_creation = (datetime.now(timezone.utc) - existing_otp.created_at).total_seconds()
        if time_since_creation < 60:
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {int(60 - time_since_creation)} seconds before requesting a new OTP"
            )
    
    # Generate OTP
    otp_code = generate_otp_code()
    code_hash = hash_otp(otp_code)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Validate password constraints
    is_valid, error_msg = validate_password(data.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Store pending user data and OTP
    # Note: We store user data temporarily. On confirm, we'll create the actual user.
    # For simplicity, we store in a separate pending table or use a cache.
    # Here we'll store directly and mark is_verified=False
    
    # Create unverified user
    user_id = str(uuid.uuid4())
    password_hash = hash_password(data.password)
    
    new_user = UserModel(
        id=user_id,
        username=username,
        email=data.email,
        display_name=data.display_name,
        avatar_url=data.avatar_url,
        password_hash=password_hash,
        role="staff",
        is_verified=False
    )
    db.add(new_user)
    
    # Create OTP record
    otp_record = EmailOtpModel(
        email=data.email,
        purpose="register",
        code_hash=code_hash,
        expires_at=expires_at,
        attempts_left=5
    )
    db.add(otp_record)
    db.commit()
    
    # Send email
    if not send_otp_email(data.email, otp_code, "register"):
        raise HTTPException(status_code=500, detail="Failed to send OTP email")
    
    return {"message": "OTP sent to email", "email": data.email}


@router.post("/register/confirm")
def register_confirm(data: RegisterConfirm, db: Session = Depends(get_db)):
    """Confirm OTP and activate account"""
    
    # Get OTP record
    otp_record = get_valid_otp(db, data.email, "register")
    if not otp_record:
        raise HTTPException(status_code=400, detail="OTP expired or not found")
    
    # Check attempts
    if otp_record.attempts_left <= 0:
        raise HTTPException(status_code=400, detail="Too many failed attempts")
    
    # Verify OTP
    if not verify_otp(data.otp, otp_record.code_hash):
        otp_record.attempts_left -= 1
        db.commit()
        raise HTTPException(
            status_code=400,
            detail=f"Invalid OTP. {otp_record.attempts_left} attempts remaining"
        )
    
    # Mark OTP as consumed
    otp_record.consumed_at = datetime.now(timezone.utc)
    
    # Activate user
    user = db.query(UserModel).filter(UserModel.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_verified = True
    db.commit()
    
    # Send welcome email
    send_welcome_email(data.email, user.username)
    
    # Generate access token
    access_token = create_access_token({"sub": user.id, "username": user.username})
    
    return {
        "message": "Registration successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "display_name": user.display_name,
            "avatar_url": user.avatar_url,
            "role": user.role
        }
    }


# ============================================
# LOGIN ENDPOINT
# ============================================

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Login with username/email and password"""
    
    # Find user by username or email
    user = db.query(UserModel).filter(
        (UserModel.username == normalize_username(data.username_or_email)) |
        (UserModel.email == data.username_or_email)
    ).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if verified
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Account not verified. Please check your email for OTP.")
    
    # Verify password
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate access token
    access_token = create_access_token({"sub": user.id, "username": user.username})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "display_name": user.display_name,
            "avatar_url": user.avatar_url,
            "role": user.role
        }
    }


# ============================================
# GET CURRENT USER
# ============================================

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user info"""
    
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
        "has_passkey": bool(user.passkey_hash)
    }


# ============================================
# PASSWORD RESET ENDPOINTS
# ============================================

@router.post("/password/request-otp")
def password_reset_request_otp(data: PasswordResetRequestOTP, db: Session = Depends(get_db)):
    """Request OTP for password reset"""
    
    # Find user
    user = db.query(UserModel).filter(
        (UserModel.username == normalize_username(data.username_or_email)) |
        (UserModel.email == data.username_or_email)
    ).first()
    
    if not user:
        # Don't reveal if user exists
        return {"message": "If the account exists, an OTP has been sent to the registered email"}
    
    # Check existing valid OTP
    existing_otp = get_valid_otp(db, user.email, "reset_password")
    if existing_otp:
        time_since_creation = (datetime.now(timezone.utc) - existing_otp.created_at).total_seconds()
        if time_since_creation < 60:
            raise HTTPException(status_code=429, detail="Please wait before requesting a new OTP")
    
    # Generate OTP
    otp_code = generate_otp_code()
    code_hash = hash_otp(otp_code)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    otp_record = EmailOtpModel(
        email=user.email,
        purpose="reset_password",
        code_hash=code_hash,
        expires_at=expires_at,
        attempts_left=5
    )
    db.add(otp_record)
    db.commit()
    
    send_otp_email(user.email, otp_code, "reset_password")
    
    return {"message": "If the account exists, an OTP has been sent to the registered email", "email": user.email}


@router.post("/password/confirm")
def password_reset_confirm(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Confirm OTP and reset password"""
    
    otp_record = get_valid_otp(db, data.email, "reset_password")
    if not otp_record:
        raise HTTPException(status_code=400, detail="OTP expired or not found")
    
    if otp_record.attempts_left <= 0:
        raise HTTPException(status_code=400, detail="Too many failed attempts")
    
    if not verify_otp(data.otp, otp_record.code_hash):
        otp_record.attempts_left -= 1
        db.commit()
        raise HTTPException(status_code=400, detail=f"Invalid OTP. {otp_record.attempts_left} attempts remaining")
    
    # Mark OTP as consumed
    otp_record.consumed_at = datetime.now(timezone.utc)
    
    # Validate new password constraints
    is_valid, error_msg = validate_password(data.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Update password
    user = db.query(UserModel).filter(UserModel.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.password_hash = hash_password(data.new_password)
    db.commit()
    
    return {"message": "Password reset successfully"}


# ============================================
# PASSKEY ENDPOINTS
# ============================================

@router.post("/passkey/request-otp")
def passkey_change_request_otp(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Request OTP for passkey change"""
    
    user = db.query(UserModel).filter(UserModel.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check existing valid OTP
    existing_otp = get_valid_otp(db, user.email, "change_passkey")
    if existing_otp:
        time_since_creation = (datetime.now(timezone.utc) - existing_otp.created_at).total_seconds()
        if time_since_creation < 60:
            raise HTTPException(status_code=429, detail="Please wait before requesting a new OTP")
    
    # Generate OTP
    otp_code = generate_otp_code()
    code_hash = hash_otp(otp_code)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    otp_record = EmailOtpModel(
        email=user.email,
        purpose="change_passkey",
        code_hash=code_hash,
        expires_at=expires_at,
        attempts_left=5
    )
    db.add(otp_record)
    db.commit()
    
    send_otp_email(user.email, otp_code, "change_passkey")
    
    return {"message": "OTP sent to your email"}


@router.post("/passkey/confirm")
def passkey_change_confirm(
    data: PasskeyChangeConfirm,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Confirm OTP and change passkey"""
    
    user = db.query(UserModel).filter(UserModel.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    otp_record = get_valid_otp(db, user.email, "change_passkey")
    if not otp_record:
        raise HTTPException(status_code=400, detail="OTP expired or not found")
    
    if otp_record.attempts_left <= 0:
        raise HTTPException(status_code=400, detail="Too many failed attempts")
    
    if not verify_otp(data.otp, otp_record.code_hash):
        otp_record.attempts_left -= 1
        db.commit()
        raise HTTPException(status_code=400, detail=f"Invalid OTP. {otp_record.attempts_left} attempts remaining")
    
    # Mark OTP as consumed
    otp_record.consumed_at = datetime.now(timezone.utc)
    
    # Update passkey
    user.passkey_hash = hash_password(data.new_passkey)
    db.commit()
    
    return {"message": "Passkey updated successfully"}
