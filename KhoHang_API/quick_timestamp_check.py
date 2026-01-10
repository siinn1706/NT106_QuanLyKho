"""Direct timestamp check using SQLAlchemy"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.database import engine, RTMessageModel
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone

SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print("=" * 80)
print("DIRECT TIMESTAMP CHECK")
print("=" * 80)

# Get latest message
msg = db.query(RTMessageModel).order_by(RTMessageModel.created_at.desc()).first()

if msg:
    print(f"\n📨 Latest Message:")
    print(f"   ID: {msg.id}")
    print(f"   Content: {msg.content[:50]}...")
    print(f"   created_at: {msg.created_at}")
    print(f"   Type: {type(msg.created_at)}")
    print(f"   Has timezone: {msg.created_at.tzinfo is not None}")
    print(f"   Timezone info: {msg.created_at.tzinfo}")
    print(f"   .isoformat(): {msg.created_at.isoformat()}")
    
    print(f"\n🔍 DIAGNOSIS:")
    if msg.created_at.tzinfo is None:
        print(f"   ❌ PROBLEM: Database returns naive datetime (no timezone)")
        print(f"   ❌ When sent to frontend, .isoformat() = '{msg.created_at.isoformat()}'")
        print(f"   ❌ Frontend interprets this as LOCAL time, not UTC!")
        print(f"   ❌ This causes time shift when reloading")
        
        # Show the fix
        fixed_dt = msg.created_at.replace(tzinfo=timezone.utc)
        print(f"\n✅ SOLUTION: Force UTC timezone")
        print(f"   fixed_dt = created_at.replace(tzinfo=timezone.utc)")
        print(f"   Result: {fixed_dt.isoformat()}")
    else:
        print(f"   ✅ Good: Timezone-aware datetime")
else:
    print("\n❌ No messages found")

db.close()
print("\n" + "=" * 80)
