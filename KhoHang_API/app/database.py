# app/database.py
"""SQLite database setup with SQLAlchemy"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON, text
from datetime import datetime, timezone
from pathlib import Path
import os
import sys

# --- SỬA ĐỔI QUAN TRỌNG: LƯU DB VÀO THƯ MỤC CỐ ĐỊNH ---
def get_datadir() -> Path:
    """Lấy đường dẫn lưu dữ liệu bền vững (AppData/Roaming/NT106_QuanLyKho)"""
    home = Path.home()
    app_name = "NT106_QuanLyKho"

    if sys.platform == "win32":
        base_path = Path(os.getenv("APPDATA", home / "AppData" / "Roaming"))
    elif sys.platform == "darwin":
        base_path = home / "Library" / "Application Support"
    else:
        base_path = home / ".local" / "share"
    
    full_path = base_path / app_name
    full_path.mkdir(parents=True, exist_ok=True)
    return full_path

# Thiết lập đường dẫn file DB cố định
DATA_DIR = get_datadir()
DB_FILE = DATA_DIR / "data.db"
DATABASE_URL = f"sqlite:///{DB_FILE}"

print(f"--- DATABASE PATH: {DB_FILE} ---") # In ra để bạn kiểm tra

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False 
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# =============================================================
# DATABASE MODELS (GIỮ NGUYÊN NHƯ CŨ)
# =============================================================

class CompanyInfoModel(Base):
    __tablename__ = "company_info"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="")
    logo = Column(Text, default="")
    tax_id = Column(String, default="")
    address = Column(String, default="")
    phone = Column(String, default="")
    email = Column(String, default="")
    bank_name = Column(String, default="")
    bank_account = Column(String, default="")
    bank_branch = Column(String, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class WarehouseModel(Base):
    __tablename__ = "warehouses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False, unique=True)
    address = Column(String, default="")
    phone = Column(String, default="")
    managers = Column(JSON, default=list)
    notes = Column(Text, default="")
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class SupplierModel(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    tax_id = Column(String, default="")
    address = Column(String, default="")
    phone = Column(String, default="")
    email = Column(String, default="")
    bank_account = Column(String, default="")
    bank_name = Column(String, default="")
    notes = Column(Text, default="")
    outstanding_debt = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class ItemModel(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, index=True) # LƯU Ý: ID LÀ SỐ NGUYÊN
    name = Column(String, nullable=False)
    sku = Column(String, nullable=False, unique=True, index=True)
    unit = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    min_stock = Column(Integer, default=10)
    quantity = Column(Integer, default=0)
    description = Column(Text, default="")
    expiry_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    supplier = relationship("SupplierModel", backref="items")

class StockTransactionModel(Base):
    __tablename__ = "stock_transactions"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    note = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    warehouse_code = Column(String, nullable=True, index=True)
    voucher_id = Column(String, nullable=True, index=True)
    actor_user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    item = relationship("ItemModel", backref="transactions")

class StockInRecordModel(Base):
    __tablename__ = "stock_in_records"
    id = Column(String, primary_key=True)
    warehouse_code = Column(String, nullable=False, index=True)
    supplier = Column(String, nullable=False)
    date = Column(String, nullable=False)
    note = Column(Text, default="")
    tax_rate = Column(Float, default=0.0)
    payment_method = Column(String, default="tiền_mặt")
    payment_bank_account = Column(String, default="")
    payment_bank_name = Column(String, default="")
    items = Column(JSON, nullable=False)
    total_quantity = Column(Integer, default=0)
    total_amount = Column(Float, default=0.0)
    status = Column(String, default="completed")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

class StockOutRecordModel(Base):
    __tablename__ = "stock_out_records"
    id = Column(String, primary_key=True)
    warehouse_code = Column(String, nullable=False, index=True)
    recipient = Column(String, nullable=False)
    purpose = Column(String, nullable=False)
    date = Column(String, nullable=False)
    note = Column(Text, default="")
    tax_rate = Column(Float, default=0.0)
    payment_method = Column(String, default="tiền_mặt")
    payment_bank_account = Column(String, default="")
    payment_bank_name = Column(String, default="")
    items = Column(JSON, nullable=False)
    total_quantity = Column(Integer, default=0)
    total_amount = Column(Float, nullable=True)
    status = Column(String, default="completed")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

class UserModel(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)  # UUID
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    display_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    passkey_hash = Column(String, nullable=True)
    role = Column(String, default="staff")
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class EmailOtpModel(Base):
    """OTP verification codes"""
    __tablename__ = "email_otps"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, index=True)
    purpose = Column(String, nullable=False)  # register, reset_password, change_passkey
    code_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts_left = Column(Integer, default=5)
    consumed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))



# =============================================================
# CHAT & USER PREFERENCES MODELS
# =============================================================

class ChatMessageModel(Base):
    """Lưu tin nhắn chat với reactions và reply info"""
    __tablename__ = "chat_messages"
    
    id = Column(String, primary_key=True)  # UUID từ frontend
    conversation_id = Column(String, nullable=False, index=True)  # bot, user_id, etc.
    sender = Column(String, nullable=False)  # "user", "agent", "bot"
    text = Column(Text, nullable=False)
    
    # Reply info (JSON: {"id": "msg_id", "text": "...", "sender": "..."} hoặc null)
    reply_to = Column(JSON, nullable=True)
    
    # Reactions (JSON array: ["👍", "❤️", ...])
    reactions = Column(JSON, default=list)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class UserPreferencesModel(Base):
    """Lưu theme preferences theo user - hỗ trợ theme riêng cho light/dark mode"""
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    
    # Theme settings
    accent_id = Column(String, default="blue")  # Accent color id
    
    # Chat theme cho Light mode
    light_mode_gradient_id = Column(String, default="default")
    light_mode_pattern_id = Column(String, nullable=True)
    light_mode_pattern_opacity = Column(Float, default=0.1)
    light_mode_pattern_size_px = Column(Integer, default=300)
    light_mode_pattern_tint = Column(String, nullable=True)
    
    # Chat theme cho Dark mode
    dark_mode_gradient_id = Column(String, default="default")
    dark_mode_pattern_id = Column(String, nullable=True)
    dark_mode_pattern_opacity = Column(Float, default=0.1)
    dark_mode_pattern_size_px = Column(Integer, default=300)
    dark_mode_pattern_tint = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationship
    user = relationship("UserModel", backref="preferences")

class ChatbotConfigModel(Base):
    """Lưu cấu hình chatbot (avatar, tên, mô tả)"""
    __tablename__ = "chatbot_config"
    
    id = Column(Integer, primary_key=True, index=True)
    avatar_url = Column(Text, nullable=True)  # Đường dẫn đến avatar
    bot_name = Column(String, default="N3T Assistant")
    bot_description = Column(String, default="Trợ lý quản lý kho")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


# =============================================================
# REALTIME CHAT MODELS (USER-TO-USER)
# =============================================================

class RTConversationModel(Base):
    """Realtime chat conversations (direct, group, module-related)"""
    __tablename__ = "rt_conversations"
    
    id = Column(String, primary_key=True)  # UUID
    type = Column(String, nullable=False, index=True)  # 'direct', 'group', 'module'
    title = Column(String, nullable=True)
    related_entity_type = Column(String, nullable=True)  # 'stock_in', 'stock_out', 'item', 'warehouse'
    related_entity_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    members = relationship("RTConversationMemberModel", back_populates="conversation", cascade="all, delete-orphan")
    messages = relationship("RTMessageModel", back_populates="conversation", cascade="all, delete-orphan")


class RTConversationMemberModel(Base):
    """Members of realtime conversations"""
    __tablename__ = "rt_conversation_members"
    
    conversation_id = Column(String, ForeignKey("rt_conversations.id"), primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    role = Column(String, default="member")  # 'member', 'admin'
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_accepted = Column(Boolean, default=False)  # True = accepted, False = pending/spam
    
    conversation = relationship("RTConversationModel", back_populates="members")
    user = relationship("UserModel")


class RTMessageModel(Base):
    """Realtime chat messages"""
    __tablename__ = "rt_messages"
    
    id = Column(String, primary_key=True)  # serverMessageId (UUID)
    conversation_id = Column(String, ForeignKey("rt_conversations.id"), nullable=False, index=True)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    client_message_id = Column(String, nullable=False)  # For idempotency
    content = Column(Text, nullable=False)
    content_type = Column(String, default="text")  # 'text', 'image', 'file', 'system'
    attachments_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    edited_at = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    
    conversation = relationship("RTConversationModel", back_populates="messages")
    sender = relationship("UserModel")
    receipts = relationship("RTMessageReceiptModel", back_populates="message", cascade="all, delete-orphan")


class RTMessageReceiptModel(Base):
    """Message delivery and read receipts"""
    __tablename__ = "rt_message_receipts"
    
    message_id = Column(String, ForeignKey("rt_messages.id"), primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    delivered_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    
    message = relationship("RTMessageModel", back_populates="receipts")
    user = relationship("UserModel")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def ensure_stock_transaction_columns(engine):
    """Ensure new stock transaction columns exist for backward compatibility."""
    try:
        with engine.begin() as conn:
            existing_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(stock_transactions)"))]
            if "warehouse_code" not in existing_cols:
                conn.execute(text("ALTER TABLE stock_transactions ADD COLUMN warehouse_code TEXT"))
            if "voucher_id" not in existing_cols:
                conn.execute(text("ALTER TABLE stock_transactions ADD COLUMN voucher_id TEXT"))
            if "actor_user_id" not in existing_cols:
                conn.execute(text("ALTER TABLE stock_transactions ADD COLUMN actor_user_id TEXT"))
    except Exception as e:
        print(f"[WARN] Could not migrate stock_transactions columns: {e}")


def ensure_rt_message_unique_constraint(engine):
    """Ensure unique constraint on (sender_id, client_message_id) for idempotency."""
    try:
        with engine.begin() as conn:
            conn.execute(text(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_rt_messages_sender_client "
                "ON rt_messages(sender_id, client_message_id)"
            ))
    except Exception as e:
        print(f"[WARN] Could not create rt_messages unique index: {e}")


def init_db():
    Base.metadata.create_all(bind=engine)
    ensure_stock_transaction_columns(engine)
    ensure_rt_message_unique_constraint(engine)
    print(f"Database initialized at {DATABASE_URL}")

init_db()