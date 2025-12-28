"""Migration script: Set default display_name for existing users"""

from app.database import SessionLocal, UserModel

def migrate_display_names():
    """Set display_name = username for users without display_name"""
    db = SessionLocal()
    try:
        # Find all users with null or empty display_name
        users = db.query(UserModel).filter(
            (UserModel.display_name == None) | (UserModel.display_name == "")
        ).all()
        
        count = 0
        for user in users:
            user.display_name = user.username
            count += 1
        
        db.commit()
        print(f"✅ Updated {count} users with default display_name")
        
        # Print all users for verification
        all_users = db.query(UserModel).all()
        print(f"\n📋 Current users in database:")
        for user in all_users:
            print(f"  - {user.username} (email: {user.email}, display_name: {user.display_name})")
            
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🔄 Starting display_name migration...")
    migrate_display_names()
