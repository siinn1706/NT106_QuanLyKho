# app/rbac.py
"""Role-Based Access Control (RBAC) utilities"""

from functools import wraps
from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from .database import UserModel, get_db

# Role hierarchy: admin > manager > staff
ROLES = {
    "admin": 3,
    "manager": 2,
    "staff": 1
}

def require_role(allowed_roles: List[str]):
    """
    Decorator to require specific roles for an endpoint.
    
    Usage:
        @app.get("/admin/users")
        @require_role(["admin"])
        def get_users(...):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user from kwargs or request
            # For now, we'll check if user is in kwargs (from dependency)
            user = kwargs.get("current_user")
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            user_role = user.get("role", "staff")
            if user_role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def has_permission(user_role: str, required_role: str) -> bool:
    """Check if user role has permission (considering hierarchy)"""
    user_level = ROLES.get(user_role, 0)
    required_level = ROLES.get(required_role, 0)
    return user_level >= required_level

def get_user_role(user_id: str, db: Session) -> Optional[str]:
    """Get user role from database"""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    return user.role if user else None

def create_or_update_user(user_id: str, email: str, name: Optional[str] = None, role: str = "staff", db: Session = None):
    """Create or update user in database"""
    if db is None:
        return
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user:
        # Update existing user
        if name:
            user.name = name
        if role:
            user.role = role
    else:
        # Create new user
        user = UserModel(
            id=user_id,
            email=email,
            name=name,
            role=role
        )
        db.add(user)
    
    db.commit()
    return user

