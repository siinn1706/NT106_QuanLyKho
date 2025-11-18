# app/schemas.py
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict , EmailStr


class ORMModel(BaseModel):
    # Cho phép Pydantic convert từ SQLAlchemy object
    model_config = ConfigDict(from_attributes=True)


# ---------- SUPPLIER ----------

class SupplierBase(BaseModel):
    name: str
    contact: str
    address: str


class SupplierCreate(SupplierBase):
    pass


class Supplier(SupplierBase, ORMModel):
    id: int


# ---------- ITEM ----------

class ItemBase(BaseModel):
    name: str
    sku: str
    quantity: int
    unit: str
    price: float
    category: str
    supplier_id: Optional[int] = None


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    supplier_id: Optional[int] = None


class Item(ItemBase, ORMModel):
    id: int


# ---------- STOCK TRANSACTION ----------

class StockTransactionBase(BaseModel):
    type: str  # 'in' | 'out'
    item_id: int
    quantity: int
    note: Optional[str] = None


class StockTransactionCreate(StockTransactionBase):
    pass


class StockTransaction(StockTransactionBase, ORMModel):
    id: int
    timestamp: datetime


# ---------- DASHBOARD STATS ----------

class DashboardStats(ORMModel):
    total_items: int
    low_stock_count: int
    total_value: float
    recent_transactions: List[StockTransaction]

class AuthRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class AuthLoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthChangePasswordRequest(BaseModel):
    email: EmailStr
    old_password: str
    new_password: str

class User(BaseModel):
    id: str
    email: EmailStr
    name: str | None = None
    role: str | None = None


class AuthResponse(BaseModel):
    user: User
    token: str
    refresh_token: str | None = None

class AuthForgotPasswordRequest(BaseModel):
    email: EmailStr

# ---------- AI CHAT ----------

class AIChatRequest(BaseModel):
    prompt: str
    system_instruction: str | None = None

class AIChatResponse(BaseModel):
    reply: str
    model: str