"""Force refresh avatar for current user"""
import sys
from app.database import SessionLocal, UserModel

def refresh_avatar():
    """Clear avatar to force re-upload"""
    email = input("Enter user email (or press Enter for baoo041221@gmail.com): ").strip()
    if not email:
        email = "baoo041221@gmail.com"
    
    db = SessionLocal()
    try:
        user = db.query(UserModel).filter(UserModel.email == email).first()
        if not user:
            print(f"❌ User not found: {email}")
            return
        
        print(f"👤 User: {user.username} ({user.email})")
        print(f"📸 Current avatar: {user.avatar_url or 'None'}")
        
        choice = input("\nDo you want to:\n1. Clear avatar (force re-upload)\n2. Keep as is\nChoice (1/2): ").strip()
        
        if choice == "1":
            old_avatar = user.avatar_url
            user.avatar_url = None
            db.commit()
            print(f"✅ Avatar cleared! Old URL: {old_avatar}")
            print("📝 User can now upload new avatar (will be converted to WebP)")
        else:
            print("⏭️  No changes made")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🔄 Force Avatar Refresh\n")
    refresh_avatar()
