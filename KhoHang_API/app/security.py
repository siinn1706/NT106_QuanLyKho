"""security.py - Security utilities for authentication"""

import os
import secrets
import hashlib
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
import jwt
from passlib.context import CryptContext

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXP_DAYS = int(os.getenv("JWT_EXP_DAYS", "7"))

# Bcrypt password length limit (72 bytes)
BCRYPT_MAX_PASSWORD_LENGTH = 72

# Password validation constraints
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 32


def truncate_password_to_safe_length(password: str) -> str:
    """
    Truncate password to 72 bytes to prevent bcrypt crash.
    Bcrypt has a hard limit of 72 bytes for passwords.
    """
    # Chuyển đổi chuỗi sang bytes (UTF-8 encoding) để kiểm tra độ dài
    password_bytes = password.encode('utf-8')
    
    # Kiểm tra & Cắt gọt: Nếu dài hơn 72 bytes, cắt từng ký tự từ cuối
    if len(password_bytes) > BCRYPT_MAX_PASSWORD_LENGTH:
        # Cắt từng ký tự từ cuối cho đến khi độ dài bytes <= 72
        truncated = password
        while len(truncated.encode('utf-8')) > BCRYPT_MAX_PASSWORD_LENGTH:
            truncated = truncated[:-1]
            # Bảo vệ khỏi vòng lặp vô hạn (trường hợp hiếm)
            if len(truncated) == 0:
                break
        return truncated
    
    # Nếu không cần cắt, trả về nguyên bản
    return password


def validate_password(password: str) -> Tuple[bool, Optional[str]]:
    """
    Validate password constraints.
    Returns: (is_valid, error_message)
    - Password must be between 8 and 32 characters (inclusive)
    """
    if not password:
        return False, "Mật khẩu không được để trống"
    
    password_length = len(password)
    
    if password_length < PASSWORD_MIN_LENGTH:
        return False, f"Mật khẩu phải có ít nhất {PASSWORD_MIN_LENGTH} ký tự"
    
    if password_length > PASSWORD_MAX_LENGTH:
        return False, f"Mật khẩu không được vượt quá {PASSWORD_MAX_LENGTH} ký tự"
    
    return True, None


def hash_password(password: str) -> str:
    """
    Hash password using NEW method: SHA256 first, then bcrypt.
    This ensures passwords of any length can be hashed safely.
    Used for new registrations and password changes.
    
    Note: Password validation should be done before calling this function.
    Use validate_password() to check constraints.
    """
    # Bước 1: Nén mật khẩu thành chuỗi cố định 64 ký tự bằng SHA256
    password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    
    # Bước 2: Hash chuỗi đã nén bằng bcrypt (luôn <= 64 ký tự, an toàn)
    return pwd_context.hash(password_hash)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Hybrid verification: Try OLD method first (for backward compatibility),
    then try NEW method if OLD fails.
    """
    # Đo độ dài mật khẩu (bytes)
    password_bytes = plain_password.encode('utf-8')
    password_length = len(password_bytes)
    
    # ============================================
    # BƯỚC 1: Kiểm tra theo chuẩn CŨ (Ưu tiên người dùng cũ)
    # ============================================
    if password_length <= BCRYPT_MAX_PASSWORD_LENGTH:
        # Mật khẩu ngắn: Thử cách cũ (đưa trực tiếp vào bcrypt)
        try:
            # Sử dụng passlib để verify (tương thích với hash cũ)
            if pwd_context.verify(plain_password, hashed_password):
                return True
        except (ValueError, Exception):
            # Nếu có lỗi (ví dụ: hash không hợp lệ), chuyển sang Bước 2
            pass
    
    # Nếu mật khẩu quá dài (> 72 bytes) hoặc cách cũ không khớp:
    # Bỏ qua Bước 1, chuyển thẳng sang Bước 2
    
    # ============================================
    # BƯỚC 2: Kiểm tra theo chuẩn MỚI (Dành cho người dùng mới hoặc mật khẩu dài)
    # ============================================
    try:
        # Nén mật khẩu thành chuỗi cố định 64 ký tự bằng SHA256
        password_hash = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
        
        # So sánh chuỗi đã nén với hash trong database
        if pwd_context.verify(password_hash, hashed_password):
            return True
    except (ValueError, Exception):
        # Nếu có lỗi, trả về False
        pass
    
    # Nếu cả 2 cách đều không khớp: Báo lỗi "Sai mật khẩu"
    return False


def generate_otp_code() -> str:
    """Generate 6-digit OTP code"""
    return ''.join([str(secrets.randbelow(10)) for _ in range(6)])


def hash_otp(code: str) -> str:
    """Hash OTP code using SHA-256"""
    return hashlib.sha256(code.encode()).hexdigest()


def verify_otp(code: str, hashed_code: str) -> bool:
    """Verify OTP code against hash"""
    return hash_otp(code) == hashed_code


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXP_DAYS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


def validate_username(username: str) -> bool:
    """Validate username format: ^[a-z0-9._-]{3,24}$"""
    import re
    pattern = r'^[a-z0-9._-]{3,24}$'
    return bool(re.match(pattern, username))


def normalize_username(username: str) -> str:
    """Normalize username to lowercase and trim"""
    return username.strip().lower()
