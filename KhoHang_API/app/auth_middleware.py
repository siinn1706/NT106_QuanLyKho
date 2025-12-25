"""auth_middleware.py - Authentication and authorization middleware"""

from typing import Optional, List
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import requests
from .config import FIREBASE_API_KEY
from .database import get_db, UserModel
from sqlalchemy.orm import Session

security = HTTPBearer(auto_error=False)  # Changed to auto_error=False for optional auth

# Role permissions mapping
ROLE_PERMISSIONS = {
    'admin': ['*'],  # All permissions
    'manager': [
        'items:read', 'items:write', 'items:delete',
        'suppliers:read', 'suppliers:write', 'suppliers:delete',
        'warehouses:read', 'warehouses:write',
        'stock:read', 'stock:write', 'stock:delete',
        'reports:read',
    ],
    'staff': [
        'items:read',
        'suppliers:read',
        'warehouses:read',
        'stock:read', 'stock:write',
    ],
}


def verify_firebase_token(token: str) -> Optional[dict]:
    """Verify Firebase ID token and return user info"""
    try:
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={FIREBASE_API_KEY}"
        response = requests.post(url, json={"idToken": token})
        
        if not response.ok:
            return None
        
        data = response.json()
        if 'users' in data and len(data['users']) > 0:
            user = data['users'][0]
            return {
                'uid': user.get('localId'),
                'email': user.get('email'),
                'name': user.get('displayName'),
            }
        return None
    except Exception as e:
        print(f"Token verification error: {e}")
        return None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[UserModel]:
    """Get current authenticated user (optional - returns None if no token)"""
    if not credentials:
        return None
    
    token = credentials.credentials
    
    # Verify token with Firebase
    user_info = verify_firebase_token(token)
    if not user_info:
        return None
    
    # Get or create user in database
    user = db.query(UserModel).filter(UserModel.id == user_info['uid']).first()
    if not user:
        # Create new user
        user = UserModel(
            id=user_info['uid'],
            email=user_info['email'],
            name=user_info.get('name'),
            role='staff',  # Default role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update user info if needed
        if user_info.get('name') and user.name != user_info['name']:
            user.name = user_info['name']
            db.commit()
            db.refresh(user)
    
    return user


async def require_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> UserModel:
    """Require authentication - raises 401 if no token"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    
    # Verify token with Firebase
    user_info = verify_firebase_token(token)
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get or create user in database
    user = db.query(UserModel).filter(UserModel.id == user_info['uid']).first()
    if not user:
        # Create new user
        user = UserModel(
            id=user_info['uid'],
            email=user_info['email'],
            name=user_info.get('name'),
            role='staff',  # Default role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update user info if needed
        if user_info.get('name') and user.name != user_info['name']:
            user.name = user_info['name']
            db.commit()
            db.refresh(user)
    
    return user


def require_permission(permission: str):
    """Decorator to require specific permission"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Get current_user from kwargs
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            user_permissions = ROLE_PERMISSIONS.get(current_user.role, [])
            
            # Check if user has permission
            has_permission = (
                '*' in user_permissions or  # Admin has all permissions
                permission in user_permissions
            )
            
            if not has_permission:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied: {permission}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_role(roles: List[str]):
    """Decorator to require specific role(s)"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if current_user.role not in roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Role required: {', '.join(roles)}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator
