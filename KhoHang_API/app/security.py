"""security.py - Security utilities for authentication"""

import os
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
import jwt
from passlib.context import CryptContext

# Password hashing context
pwd_context = CryptContext(
    schemes=["bcrypt_sha256"],
    deprecated="auto"
)


# JWT settings
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXP_DAYS = int(os.getenv("JWT_EXP_DAYS", "7"))

# Password validation constraints
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 32


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
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)




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
