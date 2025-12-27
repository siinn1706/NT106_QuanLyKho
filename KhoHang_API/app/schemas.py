# app/schemas.py
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict , EmailStr


class ORMModel(BaseModel):
    # Cho phép Pydantic convert từ SQLAlchemy object
    model_config = ConfigDict(from_attributes=True)


# ---------- COMPANY INFO ----------

class CompanyInfoBase(BaseModel):
    name: str = ""
    logo: str = ""  # base64 hoặc URL
    tax_id: str = ""  # Mã số thuế
    address: str = ""
    phone: str = ""
    email: str = ""
    bank_name: str = ""
    bank_account: str = ""
    bank_branch: str = ""


class CompanyInfoCreate(CompanyInfoBase):
    pass


class CompanyInfoUpdate(BaseModel):
    name: Optional[str] = None
    logo: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    bank_branch: Optional[str] = None


class CompanyInfo(CompanyInfoBase):
    id: int


# ---------- WAREHOUSE ----------

class WarehouseManager(BaseModel):
    name: str
    position: str  # Chức vụ: Trưởng kho, Phó kho, Thủ kho,...

class WarehouseBase(BaseModel):
    name: str
    code: str  # Mã kho (K1, K2, KHO-HCM,...)
    address: str = ""
    phone: str = ""
    managers: List[WarehouseManager] = []  # Danh sách người quản lý
    notes: str = ""


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    managers: Optional[List[WarehouseManager]] = None
    notes: Optional[str] = None


class Warehouse(WarehouseBase):
    id: int
    created_at: datetime
    is_active: bool = False  # Kho đang được chọn


# ---------- WAREHOUSE INVENTORY STATISTICS ----------

class WarehouseItemStatus(BaseModel):
    item_id: str
    item_code: str
    item_name: str
    unit: str
    total_in: int = 0  # Tổng số đã nhập
    total_out: int = 0  # Tổng số đã xuất
    current_stock: int = 0  # Tồn kho hiện tại
    damaged: int = 0  # Hàng hư hỏng
    missing: int = 0  # Hàng thiếu
    min_stock: int = 0  # Mức tồn kho tối thiểu
    status: str = "normal"  # normal, low_stock, out_of_stock, damaged


class WarehouseInventoryStats(BaseModel):
    warehouse_id: int
    warehouse_code: str
    warehouse_name: str
    total_items: int  # Tổng số loại hàng hóa
    total_quantity: int  # Tổng số lượng hàng
    items_in_stock: int  # Số loại hàng còn tồn
    items_low_stock: int  # Số loại hàng sắp hết
    items_out_of_stock: int  # Số loại hàng hết
    items_damaged: int  # Số loại hàng hư hỏng
    items_missing: int  # Số loại hàng thiếu
    total_damaged: int  # Tổng số lượng hàng hư hỏng
    total_missing: int  # Tổng số lượng hàng thiếu
    items: List[WarehouseItemStatus]  # Chi tiết từng hàng hóa


# ---------- SUPPLIER ----------

class SupplierBase(BaseModel):
    name: str
    tax_id: str = ""  # Mã số thuế
    address: str = ""
    phone: str = ""
    email: str = ""
    bank_account: str = ""  # Số tài khoản
    bank_name: str = ""  # Tên ngân hàng
    notes: str = ""


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None
    notes: Optional[str] = None


class Supplier(SupplierBase, ORMModel):
    id: int
    outstanding_debt: float = 0.0  # Công nợ còn lại


# ---------- ITEM ----------

class ItemBase(BaseModel):
    name: str
    sku: str
    unit: str
    price: float
    category: str
    supplier_id: Optional[int] = None
    # Thêm trường này để biết khi nào là "Hàng thiếu"
    min_stock: int = 10  # Định mức tồn kho tối thiểu


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


class ItemAlert(BaseModel):
    """Schema cho cảnh báo tồn kho"""
    id: str  # item id as string
    name: str
    sku: str
    currentStock: int
    minStock: int
    maxStock: int
    category: str
    lastUpdate: str  # ISO datetime string
    status: str  # 'critical' | 'warning' | 'low' | 'overstock'


class TopItem(BaseModel):
    """Schema cho top items"""
    name: str
    value: int  # quantity hoặc total value


class MonthlyTrend(BaseModel):
    """Schema cho xu hướng theo tháng"""
    month: str  # "T1", "T2", ...
    value: int


class CategoryDistribution(BaseModel):
    """Schema cho phân bố theo category"""
    name: str
    value: int
    color: str


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


# ---------- CHAT MESSAGE ----------

class ReplyInfo(BaseModel):
    """Thông tin tin nhắn đang reply"""
    id: str
    text: str
    sender: str


class ChatMessageBase(BaseModel):
    id: str
    conversation_id: str
    sender: str  # "user", "agent", "bot"
    text: str
    reply_to: ReplyInfo | None = None
    reactions: List[str] = []  # ["👍", "❤️", ...]


class ChatMessageCreate(ChatMessageBase):
    pass


class ChatMessageUpdate(BaseModel):
    reactions: List[str] | None = None  # Cập nhật reactions


class ChatMessage(ChatMessageBase, ORMModel):
    created_at: datetime
    updated_at: datetime | None = None


# ---------- USER PREFERENCES (Theme) ----------

class ChatThemeConfig(BaseModel):
    """Config theme cho một chế độ (light hoặc dark)"""
    gradient_id: str = "default"
    pattern_id: str | None = None
    pattern_opacity: float = 0.1
    pattern_size_px: int = 300
    pattern_tint: str | None = None


class UserPreferencesBase(BaseModel):
    accent_id: str = "blue"
    
    # Chat theme cho Light mode
    light_mode_theme: ChatThemeConfig = ChatThemeConfig()
    
    # Chat theme cho Dark mode
    dark_mode_theme: ChatThemeConfig = ChatThemeConfig()


class UserPreferencesCreate(UserPreferencesBase):
    pass


class UserPreferencesUpdate(BaseModel):
    accent_id: str | None = None
    light_mode_theme: ChatThemeConfig | None = None
    dark_mode_theme: ChatThemeConfig | None = None


class UserPreferences(UserPreferencesBase, ORMModel):
    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime | None = None


# ---------- STOCK IN/OUT BATCH ----------

class StockInItemCreate(BaseModel):
    item_id: str
    item_code: str
    item_name: str
    quantity: int
    unit: str
    price: float = 0


class StockInBatchCreate(BaseModel):
    warehouse_code: str  # Mã kho (K1, K2,...)
    supplier: str
    date: str
    note: str = ""
    tax_rate: float = 0
    payment_method: str = "tiền_mặt"  # tiền_mặt, chuyển_khoản, công_nợ
    payment_bank_account: str = ""  # Số TK nếu chuyển khoản
    payment_bank_name: str = ""  # Tên ngân hàng nếu chuyển khoản
    items: List[StockInItemCreate]


class StockInItem(BaseModel):
    item_id: str
    item_code: str
    item_name: str
    quantity: int
    unit: str
    price: float


class StockInRecord(BaseModel):
    id: str
    warehouse_code: str  # Mã kho (K1, K2,...)
    supplier: str
    date: str
    note: str
    tax_rate: float = 0
    payment_method: str = "tiền_mặt"
    payment_bank_account: str = ""
    payment_bank_name: str = ""
    items: List[StockInItem]
    total_quantity: int
    total_amount: float
    created_at: str
    status: str = "completed"


class StockOutItemCreate(BaseModel):
    item_id: str
    item_code: str
    item_name: str
    quantity: int
    unit: str
    sell_price: float | None = None


class StockOutBatchCreate(BaseModel):
    warehouse_code: str  # Mã kho (K1, K2,...)
    recipient: str
    purpose: str
    date: str
    note: str = ""
    tax_rate: float = 0
    payment_method: str = "tiền_mặt"  # tiền_mặt, chuyển_khoản, công_nợ
    payment_bank_account: str = ""  # Số TK nếu chuyển khoản
    payment_bank_name: str = ""  # Tên ngân hàng nếu chuyển khoản
    items: List[StockOutItemCreate]


class StockOutItem(BaseModel):
    item_id: str
    item_code: str
    item_name: str
    quantity: int
    unit: str
    sell_price: float | None = None


class StockOutRecord(BaseModel):
    id: str
    warehouse_code: str  # Mã kho (K1, K2,...)
    recipient: str
    purpose: str
    date: str
    note: str
    tax_rate: float = 0
    items: List[StockOutItem]
    total_quantity: int
    total_amount: float | None = None
    created_at: str
    status: str = "completed"