"""
Diagnostic script to check timestamp storage and retrieval in SQLite database
Purpose: Identify if timezone information is preserved or lost
"""

import sys
from pathlib import Path
from datetime import datetime, timezone
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import RTMessageModel, Base
from app.config import DATABASE_URL

def main():
    print("=" * 80)
    print("TIMESTAMP DIAGNOSTIC REPORT")
    print("=" * 80)
    print()
    
    # Create engine and session
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # 1. Check raw SQLite storage
        print("1. RAW SQLITE STORAGE CHECK")
        print("-" * 80)
        result = db.execute(text(
            "SELECT id, created_at, typeof(created_at) as type "
            "FROM rt_messages "
            "ORDER BY created_at DESC LIMIT 5"
        ))
        rows = result.fetchall()
        
        if rows:
            for row in rows:
                print(f"  ID: {row[0][:8]}...")
                print(f"  Raw Value: {row[1]}")
                print(f"  SQLite Type: {row[2]}")
                print()
        else:
            print("  No messages found in database")
        print()
        
        # 2. Check Python datetime object retrieval
        print("2. PYTHON DATETIME OBJECT CHECK")
        print("-" * 80)
        messages = db.query(RTMessageModel).order_by(RTMessageModel.created_at.desc()).limit(5).all()
        
        if messages:
            for msg in messages:
                print(f"  Message ID: {msg.id[:8]}...")
                print(f"  created_at type: {type(msg.created_at)}")
                print(f"  created_at value: {msg.created_at}")
                print(f"  Has tzinfo: {msg.created_at.tzinfo is not None}")
                print(f"  tzinfo value: {msg.created_at.tzinfo}")
                print(f"  .isoformat(): {msg.created_at.isoformat()}")
                print()
        else:
            print("  No messages found")
        print()
        
        # 3. Test creating new timestamp
        print("3. NEW TIMESTAMP TEST")
        print("-" * 80)
        test_dt_utc = datetime.now(timezone.utc)
        print(f"  Python datetime.now(timezone.utc):")
        print(f"    Value: {test_dt_utc}")
        print(f"    Type: {type(test_dt_utc)}")
        print(f"    Has tzinfo: {test_dt_utc.tzinfo is not None}")
        print(f"    tzinfo: {test_dt_utc.tzinfo}")
        print(f"    .isoformat(): {test_dt_utc.isoformat()}")
        print()
        
        # 4. Summary and recommendations
        print("4. DIAGNOSIS SUMMARY")
        print("-" * 80)
        
        if messages and messages[0].created_at.tzinfo is None:
            print("  ⚠️  ISSUE FOUND: Database returns naive datetime (no timezone)")
            print("  ⚠️  This causes .isoformat() to NOT include timezone suffix")
            print("  ⚠️  Frontend will misinterpret the timestamp")
            print()
            print("  RECOMMENDATIONS:")
            print("  1. Force timezone awareness when reading from database")
            print("  2. Use .replace(tzinfo=timezone.utc) on naive datetimes")
            print("  3. Or store timezone info explicitly in SQLite")
        elif messages and messages[0].created_at.tzinfo is not None:
            print("  ✅ GOOD: Database returns timezone-aware datetime")
            print("  ✅ .isoformat() will include timezone suffix")
        else:
            print("  ℹ️  No messages to analyze")
        
        print()
        print("=" * 80)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main()
