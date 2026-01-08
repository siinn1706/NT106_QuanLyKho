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

            # Allow access if the user meets or exceeds at least one required role
            is_authorized = any(
                has_permission(user_role, role)
                for role in allowed_roles
            )

            if not is_authorized:
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
    role_value = getattr(user, "role", None) if user else None
    return role_value if isinstance(role_value, str) else None


def create_or_update_user(
    user_id: str,
    email: str,
    name: Optional[str] = None,
    role: str = "staff",
    db: Optional[Session] = None,
):
    """Create or update user in database"""
    if db is None:
        return
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user:
        # Update existing user
        if name:
            setattr(user, "name", name)
        if role:
            setattr(user, "role", role)
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

