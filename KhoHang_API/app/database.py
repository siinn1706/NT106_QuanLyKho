# app/database.py
"""SQLite database setup with SQLAlchemy"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON
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
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=True)
    role = Column(String, default="staff")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    print(f"Database initialized at {DATABASE_URL}")

init_db()