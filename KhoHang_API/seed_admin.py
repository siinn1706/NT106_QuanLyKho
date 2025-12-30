"""
Seed admin user for testing
Creates admin account: username=admin, password=123456
"""

import sys
from pathlib import Path

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal, UserModel
import uuid
from datetime import datetime, timezone
import bcrypt


def hash_password_simple(password: str) -> str:
    """Simple bcrypt hash"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def seed_admin():
    db = SessionLocal()
    try:
        # Check if admin already exists
        existing_admin = db.query(UserModel).filter(UserModel.username == "admin").first()
        if existing_admin:
            print("✓ Admin user already exists")
            print(f"  Username: admin")
            print(f"  Email: {existing_admin.email}")
            print(f"  Role: {existing_admin.role}")
            return
        
        # Create admin user with simple bcrypt
        password = "123456"
        passkey = "123456"
        
        admin_user = UserModel(
            id=str(uuid.uuid4()),
            username="admin",
            email="admin@n3t.com",
            display_name="Administrator",
            password_hash=hash_password_simple(password),
            passkey_hash=hash_password_simple(passkey),
            role="admin",
            is_verified=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        db.add(admin_user)
        db.commit()
        
        print("✓ Admin user created successfully!")
        print(f"  Username: admin")
        print(f"  Email: admin@n3t.com")
        print(f"  Password: 123456")
        print(f"  Passkey: 123456")
        print(f"  Role: admin")
        print(f"  ID: {admin_user.id}")
        
    except Exception as e:
        print(f"✗ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 50)
    print("Seeding admin user...")
    print("=" * 50)
    seed_admin()
    print("=" * 50)
