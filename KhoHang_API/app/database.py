# app/database.py
"""SQLite database setup with SQLAlchemy"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timezone
from pathlib import Path

# Database file path
BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_URL = f"sqlite:///{BASE_DIR}/data.db"

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Needed for SQLite
    echo=False  # Set to True for SQL query logging
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


# =============================================================
# DATABASE MODELS
# =============================================================

class CompanyInfoModel(Base):
    __tablename__ = "company_info"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="")
    logo = Column(Text, default="")  # base64 or URL
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
    managers = Column(JSON, default=list)  # List of {name, position}
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
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sku = Column(String, nullable=False, unique=True, index=True)
    unit = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    min_stock = Column(Integer, default=10)
    quantity = Column(Integer, default=0)  # Current stock quantity
    description = Column(Text, default="")
    expiry_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    supplier = relationship("SupplierModel", backref="items")


class StockTransactionModel(Base):
    __tablename__ = "stock_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # 'in' or 'out'
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    note = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # Relationships
    item = relationship("ItemModel", backref="transactions")


class StockInRecordModel(Base):
    __tablename__ = "stock_in_records"
    
    id = Column(String, primary_key=True)  # Format: K1_PN_1225_0001
    warehouse_code = Column(String, nullable=False, index=True)
    supplier = Column(String, nullable=False)
    date = Column(String, nullable=False)  # ISO date string
    note = Column(Text, default="")
    tax_rate = Column(Float, default=0.0)
    payment_method = Column(String, default="tiền_mặt")
    payment_bank_account = Column(String, default="")
    payment_bank_name = Column(String, default="")
    items = Column(JSON, nullable=False)  # List of StockInItem
    total_quantity = Column(Integer, default=0)
    total_amount = Column(Float, default=0.0)
    status = Column(String, default="completed")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)


class StockOutRecordModel(Base):
    __tablename__ = "stock_out_records"
    
    id = Column(String, primary_key=True)  # Format: K1_PX_1225_0001
    warehouse_code = Column(String, nullable=False, index=True)
    recipient = Column(String, nullable=False)
    purpose = Column(String, nullable=False)
    date = Column(String, nullable=False)  # ISO date string
    note = Column(Text, default="")
    tax_rate = Column(Float, default=0.0)
    payment_method = Column(String, default="tiền_mặt")
    payment_bank_account = Column(String, default="")
    payment_bank_name = Column(String, default="")
    items = Column(JSON, nullable=False)  # List of StockOutItem
    total_quantity = Column(Integer, default=0)
    total_amount = Column(Float, nullable=True)
    status = Column(String, default="completed")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)


class UserModel(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)  # Firebase UID
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=True)
    role = Column(String, default="staff")  # 'admin', 'manager', 'staff'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


# =============================================================
# HELPER FUNCTIONS
# =============================================================

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database - create all tables"""
    Base.metadata.create_all(bind=engine)
    print(f"Database initialized at {DATABASE_URL}")


# Initialize database on import
init_db()
