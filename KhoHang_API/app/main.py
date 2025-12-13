# app/main.py
from typing import List, Any, Dict
import os
import shutil
from pathlib import Path
import uuid

from fastapi import FastAPI, HTTPException, status, File, UploadFile
from fastapi.responses import PlainTextResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import requests
from datetime import datetime, timezone
from PIL import Image
import io

from . import schemas
from .config import FIREBASE_API_KEY
from .gemini_client import generate_reply, is_configured as gemini_ready, MODEL_NAME
from .export_service import VoucherExportRequest, export_to_excel, export_to_pdf

# =============================================================
# In-memory stores (Firebase DB sẽ thay thế sau) - Tạm thời
# =============================================================
suppliers_store: Dict[int, schemas.Supplier] = {}
items_store: Dict[int, schemas.Item] = {}
stock_transactions_store: List[schemas.StockTransaction] = []

# Company & Warehouse stores
company_info: schemas.CompanyInfo | None = None
warehouses_store: Dict[int, schemas.Warehouse] = {}
active_warehouse_id: int | None = None

_supplier_id = 1
_item_id = 1
_tx_id = 1
_warehouse_id = 1

def _next_supplier_id() -> int:
    global _supplier_id
    i = _supplier_id
    _supplier_id += 1
    return i

def _next_item_id() -> int:
    global _item_id
    i = _item_id
    _item_id += 1
    return i

def _next_tx_id() -> int:
    global _tx_id
    i = _tx_id
    _tx_id += 1
    return i

def _next_warehouse_id() -> int:
    global _warehouse_id
    i = _warehouse_id
    _warehouse_id += 1
    return i

# Tạo thư mục lưu uploads
UPLOADS_DIR = Path("uploads")
UPLOADS_DIR.mkdir(exist_ok=True)
LOGO_DIR = UPLOADS_DIR / "logos"
LOGO_DIR.mkdir(exist_ok=True)

app = FastAPI(title="N3T KhoHang API", version="0.1.0")

# Mount static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS: dev thì cho phép tất cả, sau này có thể siết lại
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # hoặc ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------
# ROOT
# -------------------------------------------------
@app.get("/")
def root():
    return {"message": "N3T KhoHang API is running"}


# -------------------------------------------------
# AUTH (Firebase)
# -------------------------------------------------

@app.post("/auth/register", response_model=schemas.AuthResponse)
def register_user(payload: schemas.AuthRegisterRequest):
    """
    Đăng ký tài khoản mới qua Firebase Auth
    """
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={FIREBASE_API_KEY}"
    data: Dict[str, Any] = {
        "email": payload.email,
        "password": payload.password,
        "returnSecureToken": True,
    }
    if payload.full_name:
        data["displayName"] = payload.full_name

    r = requests.post(url, json=data)
    if not r.ok:
        err = r.json()
        msg = err.get("error", {}).get("message", "FIREBASE_SIGNUP_FAILED")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )

    fb = r.json()
    user = schemas.User(
        id=fb.get("localId", ""),
        email=fb["email"],
        name=fb.get("displayName"),
    )
    return schemas.AuthResponse(
        user=user,
        token=fb["idToken"],
        refresh_token=fb.get("refreshToken"),
    )


@app.post("/auth/login", response_model=schemas.AuthResponse)
def login_user(payload: schemas.AuthLoginRequest):
    """
    Đăng nhập bằng email/password qua Firebase Auth
    """
    url = (
        "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
        f"?key={FIREBASE_API_KEY}"
    )
    data: Dict[str, Any] = {
        "email": payload.email,
        "password": payload.password,
        "returnSecureToken": True,
    }

    r = requests.post(url, json=data)
    if not r.ok:
        err = r.json()
        msg = err.get("error", {}).get("message", "FIREBASE_LOGIN_FAILED")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )

    fb = r.json()
    user = schemas.User(
        id=fb.get("localId", ""),
        email=fb["email"],
        name=fb.get("displayName"),
    )
    return schemas.AuthResponse(
        user=user,
        token=fb["idToken"],
        refresh_token=fb.get("refreshToken"),
    )

@app.post("/auth/change-password")
def change_password(payload: schemas.AuthChangePasswordRequest):
    """
    Đổi mật khẩu:
    1. Đăng nhập bằng mật khẩu cũ để lấy ID Token (xác thực người dùng).
    2. Dùng ID Token để cập nhật mật khẩu mới.
    """
    # 1. Xác thực (Login) với mật khẩu cũ
    login_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
    login_data = {
        "email": payload.email,
        "password": payload.old_password,
        "returnSecureToken": True,
    }
    
    r_login = requests.post(login_url, json=login_data)
    if not r_login.ok:
        raise HTTPException(status_code=400, detail="Mật khẩu cũ không chính xác")
    
    id_token = r_login.json().get("idToken")

    # 2. Cập nhật mật khẩu mới
    update_url = f"https://identitytoolkit.googleapis.com/v1/accounts:update?key={FIREBASE_API_KEY}"
    update_data = {
        "idToken": id_token,
        "password": payload.new_password,
        "returnSecureToken": False,
    }
    
    r_update = requests.post(update_url, json=update_data)
    if not r_update.ok:
        err = r_update.json()
        msg = err.get("error", {}).get("message", "CHANGE_PASSWORD_FAILED")
        raise HTTPException(status_code=400, detail=msg)

    return {"message": "Đổi mật khẩu thành công"}


@app.post("/auth/logout", status_code=200)
def logout_user():
    """
    Firebase không có API sign-out phía server cho REST; client chỉ cần xoá token.
    Endpoint này tồn tại để đồng bộ luồng UI, luôn trả 200.
    """
    return {"message": "logged out"}


@app.post("/auth/forgot-password", status_code=200)
def forgot_password(payload: schemas.AuthForgotPasswordRequest):
    """
    Gửi email đặt lại mật khẩu qua Firebase Auth
    """
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={FIREBASE_API_KEY}"
    data = {
        "requestType": "PASSWORD_RESET",
        "email": payload.email,
    }

    r = requests.post(url, json=data)
    if not r.ok:
        err = r.json()
        msg = err.get("error", {}).get("message", "FIREBASE_ERROR")
        # Một số lỗi phổ biến: EMAIL_NOT_FOUND
        if msg == "EMAIL_NOT_FOUND":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email không tồn tại trong hệ thống",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )
    
    return {"message": "Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư."}


# -------------------------------------------------
# SUPPLIERS
# -------------------------------------------------

@app.get("/suppliers", response_model=List[schemas.Supplier])
def get_suppliers():
    return list(suppliers_store.values())


@app.post("/suppliers", response_model=schemas.Supplier)
def create_supplier(supplier: schemas.SupplierCreate):
    new_supplier = schemas.Supplier(id=_next_supplier_id(), **supplier.model_dump())
    suppliers_store[new_supplier.id] = new_supplier
    return new_supplier


@app.get("/suppliers/{supplier_id}/transactions")
def get_supplier_transactions(supplier_id: int):
    """
    API: GET /suppliers/{supplier_id}/transactions
    Purpose: Lấy lịch sử giao dịch nhập/xuất kho của một nhà cung cấp
    Response (JSON) [200]: {
        "stock_in": [...],  // List[StockInRecord]
        "stock_out": [...],  // List[StockOutRecord]
        "total_transactions": int,
        "outstanding_debt": float
    }
    Response Errors:
    - 404: { "detail": "Supplier not found" }
    """
    supplier = suppliers_store.get(supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhà cung cấp")
    
    # Filter stock in records by supplier name
    stock_in_records = [
        record for record in stock_in_store.values()
        if record.supplier == supplier.name
    ]
    
    # Stock out doesn't have supplier field, so we return empty list
    # In real scenario, you might have supplier tracking in stock out too
    stock_out_records = []
    
    return {
        "stock_in": stock_in_records,
        "stock_out": stock_out_records,
        "total_transactions": len(stock_in_records) + len(stock_out_records),
        "outstanding_debt": supplier.outstanding_debt
    }

# -------------------------------------------------
# ITEMS
# -------------------------------------------------

@app.get("/items", response_model=List[schemas.Item])
def get_items():
    return list(items_store.values())


@app.post("/items", response_model=schemas.Item)
def create_item(item: schemas.ItemCreate):
    for existing in items_store.values():
        if existing.sku == item.sku:
            raise HTTPException(status_code=400, detail="SKU đã tồn tại")
    new_item = schemas.Item(id=_next_item_id(), **item.model_dump())
    items_store[new_item.id] = new_item
    return new_item


@app.put("/items/{item_id}", response_model=schemas.Item)
def update_item(item_id: int, item: schemas.ItemUpdate):
    db_item = items_store.get(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Không tìm thấy hàng hoá")
    data = item.model_dump(exclude_unset=True)
    updated = db_item.model_copy(update=data)
    items_store[item_id] = updated
    return updated


@app.delete("/items/{item_id}", status_code=204)
def delete_item(item_id: int):
    if item_id not in items_store:
        raise HTTPException(status_code=404, detail="Không tìm thấy hàng hoá")
    del items_store[item_id]
    return


# -------------------------------------------------
# STOCK TRANSACTIONS
# -------------------------------------------------

@app.get("/stock/transactions", response_model=List[schemas.StockTransaction])
def get_transactions():
    # newest first
    return sorted(stock_transactions_store, key=lambda t: t.timestamp, reverse=True)


@app.post("/stock/transactions", response_model=schemas.StockTransaction)
def create_transaction(tx: schemas.StockTransactionCreate):
    item = items_store.get(tx.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy hàng hoá")
    if tx.type == "in":
        new_qty = item.quantity + tx.quantity
    elif tx.type == "out":
        if item.quantity < tx.quantity:
            raise HTTPException(status_code=400, detail="Không đủ tồn kho để xuất")
        new_qty = item.quantity - tx.quantity
    else:
        raise HTTPException(status_code=400, detail="Loại giao dịch phải là 'in' hoặc 'out'")
    # Update item quantity
    updated_item = item.model_copy(update={"quantity": new_qty})
    items_store[item.id] = updated_item
    # Create transaction
    tx_schema = schemas.StockTransaction(
        id=_next_tx_id(),
        type=tx.type,
        item_id=tx.item_id,
        quantity=tx.quantity,
        note=tx.note,
        timestamp=datetime.now(timezone.utc),
    )
    stock_transactions_store.append(tx_schema)
    return tx_schema


# -------------------------------------------------
# DASHBOARD
# -------------------------------------------------

@app.get("/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats():
    items = list(items_store.values())
    total_items = len(items)
    low_stock_count = sum(1 for i in items if i.quantity < 10)
    total_value = sum(i.quantity * i.price for i in items)
    recent_transactions = sorted(stock_transactions_store, key=lambda t: t.timestamp, reverse=True)[:10]
    return schemas.DashboardStats(
        total_items=total_items,
        low_stock_count=low_stock_count,
        total_value=total_value,
        recent_transactions=recent_transactions,
    )


# -------------------------------------------------
# AI CHAT (Gemini proxy)
# -------------------------------------------------
# UI gọi POST /ai/chat với JSON: {"prompt": "...", "system_instruction": "optional"}
# Server sẽ dùng GEMINI_API_KEY (đặt trong .env) để gọi model gemini-2.5-pro
# Trả về: {"reply": "...", "model": "gemini-2.5-pro"}

@app.post("/ai/chat", response_model=schemas.AIChatResponse)
def ai_chat(req: schemas.AIChatRequest):
    if not gemini_ready():
        raise HTTPException(status_code=501, detail="Gemini API chưa được cấu hình trên server")
    try:
        reply = generate_reply(req.prompt, req.system_instruction)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {e}")
    return schemas.AIChatResponse(reply=reply, model=MODEL_NAME)


# Trả về dưới dạng Markdown thuần (Content-Type: text/markdown)
@app.post(
    "/ai/chat-md",
    response_class=PlainTextResponse,
    responses={200: {"content": {"text/markdown": {}}}},
)
def ai_chat_markdown(req: schemas.AIChatRequest):
    if not gemini_ready():
        raise HTTPException(status_code=501, detail="Gemini API chưa được cấu hình trên server")
    try:
        reply = generate_reply(req.prompt, req.system_instruction)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {e}")
    return PlainTextResponse(reply, media_type="text/markdown")


# -------------------------------------------------
# STOCK IN (Nhập kho)
# -------------------------------------------------

# In-memory store for stock in records
stock_in_store: Dict[str, schemas.StockInRecord] = {}
# Counter theo tháng: key = "MMYY", value = counter
_stock_in_monthly_counters: Dict[str, int] = {}

def _next_stock_in_id(warehouse_code: str, date_str: str) -> str:
    """
    Generate mã phiếu nhập theo format: KX_PN_MMYY_XXXX
    - warehouse_code: K1, K2, ...
    - PN: Phiếu Nhập
    - MMYY: tháng năm từ date_str
    - XXXX: STT trong tháng (reset mỗi tháng)
    """
    from datetime import datetime
    try:
        date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except:
        date_obj = datetime.now()
    
    month_year_key = date_obj.strftime("%m%y")  # MMYY
    
    # Lấy hoặc tạo counter cho tháng này
    if month_year_key not in _stock_in_monthly_counters:
        _stock_in_monthly_counters[month_year_key] = 1
    else:
        _stock_in_monthly_counters[month_year_key] += 1
    
    counter = _stock_in_monthly_counters[month_year_key]
    
    # Format: K1_PN_1225_0001
    id_str = f"{warehouse_code}_PN_{month_year_key}_{counter:04d}"
    return id_str


@app.get("/stock/in", response_model=List[schemas.StockInRecord])
def get_stock_in_records():
    """Lấy danh sách phiếu nhập kho"""
    return list(stock_in_store.values())


@app.get("/stock/in/{record_id}", response_model=schemas.StockInRecord)
def get_stock_in_record(record_id: str):
    """Lấy chi tiết phiếu nhập kho theo ID"""
    if record_id not in stock_in_store:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu nhập kho")
    return stock_in_store[record_id]


@app.post("/stock/in", response_model=schemas.StockInRecord, status_code=201)
def create_stock_in(data: schemas.StockInBatchCreate):
    """Tạo phiếu nhập kho mới"""
    record_id = _next_stock_in_id(data.warehouse_code, data.date)
    
    # Calculate totals
    total_qty = sum(item.quantity for item in data.items)
    total_amt = sum(item.quantity * item.price for item in data.items)
    
    # Create record
    record = schemas.StockInRecord(
        id=record_id,
        warehouse_code=data.warehouse_code,
        supplier=data.supplier,
        date=data.date,
        note=data.note,
        tax_rate=data.tax_rate,
        items=[schemas.StockInItem(**item.model_dump()) for item in data.items],
        total_quantity=total_qty,
        total_amount=total_amt,
        created_at=datetime.now(timezone.utc).isoformat(),
        status="completed"
    )
    
    stock_in_store[record_id] = record
    return record


@app.delete("/stock/in/{record_id}", status_code=204)
def delete_stock_in(record_id: str):
    """Xóa phiếu nhập kho"""
    if record_id not in stock_in_store:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu nhập kho")
    del stock_in_store[record_id]
    return None


# -------------------------------------------------
# STOCK OUT (Xuất kho)
# -------------------------------------------------

# In-memory store for stock out records
stock_out_store: Dict[str, schemas.StockOutRecord] = {}
# Counter theo tháng: key = "MMYY", value = counter
_stock_out_monthly_counters: Dict[str, int] = {}

def _next_stock_out_id(warehouse_code: str, date_str: str) -> str:
    """
    Generate mã phiếu xuất theo format: KX_PX_MMYY_XXXX
    - warehouse_code: K1, K2, ...
    - PX: Phiếu Xuất
    - MMYY: tháng năm từ date_str
    - XXXX: STT trong tháng (reset mỗi tháng)
    """
    from datetime import datetime
    try:
        date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except:
        date_obj = datetime.now()
    
    month_year_key = date_obj.strftime("%m%y")  # MMYY
    
    # Lấy hoặc tạo counter cho tháng này
    if month_year_key not in _stock_out_monthly_counters:
        _stock_out_monthly_counters[month_year_key] = 1
    else:
        _stock_out_monthly_counters[month_year_key] += 1
    
    counter = _stock_out_monthly_counters[month_year_key]
    
    # Format: K1_PX_1225_0001
    id_str = f"{warehouse_code}_PX_{month_year_key}_{counter:04d}"
    return id_str


@app.get("/stock/out", response_model=List[schemas.StockOutRecord])
def get_stock_out_records():
    """Lấy danh sách phiếu xuất kho"""
    return list(stock_out_store.values())


@app.get("/stock/out/{record_id}", response_model=schemas.StockOutRecord)
def get_stock_out_record(record_id: str):
    """Lấy chi tiết phiếu xuất kho theo ID"""
    if record_id not in stock_out_store:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu xuất kho")
    return stock_out_store[record_id]


@app.post("/stock/out", response_model=schemas.StockOutRecord, status_code=201)
def create_stock_out(data: schemas.StockOutBatchCreate):
    """Tạo phiếu xuất kho mới"""
    record_id = _next_stock_out_id(data.warehouse_code, data.date)
    
    # Calculate totals
    total_qty = sum(item.quantity for item in data.items)
    # total_amount only for "Bán hàng" purpose
    total_amt = None
    if data.purpose == "Bán hàng":
        total_amt = sum(item.quantity * (item.sell_price or 0) for item in data.items)
    
    # Create record
    record = schemas.StockOutRecord(
        id=record_id,
        warehouse_code=data.warehouse_code,
        recipient=data.recipient,
        purpose=data.purpose,
        date=data.date,
        note=data.note,
        tax_rate=data.tax_rate,
        items=[schemas.StockOutItem(**item.model_dump()) for item in data.items],
        total_quantity=total_qty,
        total_amount=total_amt,
        created_at=datetime.now(timezone.utc).isoformat(),
        status="completed"
    )
    
    stock_out_store[record_id] = record
    return record


@app.delete("/stock/out/{record_id}", status_code=204)
def delete_stock_out(record_id: str):
    """Xóa phiếu xuất kho"""
    if record_id not in stock_out_store:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu xuất kho")
    del stock_out_store[record_id]
    return None


# -------------------------------------------------
# EXPORT (Excel & PDF)
# -------------------------------------------------

@app.post("/export/excel")
def export_voucher_excel(data: VoucherExportRequest):
    """
    Xuất phiếu nhập/xuất kho ra file Excel (.xlsx)
    
    Request Body (JSON):
    {
        "voucher_type": "PN" | "PX",
        "voucher_no": "PN-000123",
        "voucher_date": "2025-12-13",
        "partner_name": "Nhà cung cấp A",
        "invoice_no": "HD001",           // optional
        "invoice_date": "2025-12-13",    // optional
        "warehouse_code": "K01",
        "warehouse_location": "Kho chính", // optional
        "attachments": "1 phiếu",        // optional
        "prepared_by": "Nguyễn Văn A",   // optional
        "receiver": "Trần Văn B",        // optional
        "storekeeper": "Lê Thị C",       // optional
        "director": "Phạm Văn D",        // optional
        "items": [
            {
                "sku": "SP-001",
                "name": "Sản phẩm A",
                "unit": "Cái",
                "qty_doc": 10,
                "qty_actual": 10,
                "unit_price": 100000
            }
        ]
    }
    
    Response: File stream (.xlsx)
    Headers:
        - Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
        - Content-Disposition: attachment; filename="PN_K01_202512_PN-000123.xlsx"
    """
    try:
        # Validate items count
        if len(data.items) > 18:
            raise HTTPException(
                status_code=400,
                detail="Template chỉ hỗ trợ tối đa 18 dòng hàng hóa"
            )
        
        buffer, filename = export_to_excel(data)
        
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export Excel error: {str(e)}")


@app.post("/export/pdf")
def export_voucher_pdf(data: VoucherExportRequest):
    """
    Xuất phiếu nhập/xuất kho ra file PDF
    
    Request Body (JSON): Giống /export/excel
    
    Response: File stream (.pdf)
    Headers:
        - Content-Type: application/pdf
        - Content-Disposition: attachment; filename="PN_K01_202512_PN-000123.pdf"
    """
    try:
        # Validate items count
        if len(data.items) > 18:
            raise HTTPException(
                status_code=400,
                detail="Template chỉ hỗ trợ tối đa 18 dòng hàng hóa"
            )
        
        buffer, filename = export_to_pdf(data)
        
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export PDF error: {str(e)}")


# -------------------------------------------------
# COMPANY INFO
# -------------------------------------------------

@app.post("/company/upload-logo")
async def upload_company_logo(file: UploadFile = File(...)):
    """
    Upload logo công ty
    - Giới hạn: 10MB
    - Ảnh phải vuông (1:1 ratio)
    - Trả về URL để truy cập logo
    """
    try:
        # Kiểm tra file size (10MB = 10 * 1024 * 1024 bytes)
        MAX_SIZE = 10 * 1024 * 1024
        contents = await file.read()
        
        if len(contents) > MAX_SIZE:
            raise HTTPException(
                status_code=400,
                detail="Kích thước file vượt quá 10MB"
            )
        
        # Kiểm tra định dạng ảnh
        try:
            image = Image.open(io.BytesIO(contents))
            width, height = image.size
            
            # Kiểm tra aspect ratio (1:1 - vuông)
            if width != height:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ảnh phải vuông (1:1). Ảnh hiện tại: {width}x{height}"
                )
            
            # Kiểm tra định dạng
            if image.format.lower() not in ['png', 'jpg', 'jpeg', 'webp']:
                raise HTTPException(
                    status_code=400,
                    detail="Chỉ hỗ trợ định dạng: PNG, JPG, JPEG, WEBP"
                )
                
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=400,
                detail="File không phải là ảnh hợp lệ"
            )
        
        # Tạo tên file mới (UUID + extension)
        file_ext = file.filename.split('.')[-1].lower() if file.filename else 'png'
        new_filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = LOGO_DIR / new_filename
        
        # Lưu file
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Trầ về URL
        logo_url = f"/uploads/logos/{new_filename}"
        
        return {
            "logo_url": logo_url,
            "filename": new_filename,
            "size": len(contents),
            "dimensions": f"{width}x{height}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi upload logo: {str(e)}"
        )


@app.get("/company", response_model=schemas.CompanyInfo | None)
def get_company_info():
    """Lấy thông tin công ty"""
    return company_info


@app.post("/company", response_model=schemas.CompanyInfo)
def create_or_update_company_info(data: schemas.CompanyInfoCreate):
    """Tạo hoặc cập nhật thông tin công ty"""
    global company_info
    
    if company_info is None:
        # Tạo mới
        company_info = schemas.CompanyInfo(id=1, **data.model_dump())
    else:
        # Cập nhật
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(company_info, key, value)
    
    return company_info


@app.put("/company", response_model=schemas.CompanyInfo)
def update_company_info(data: schemas.CompanyInfoUpdate):
    """Cập nhật một phần thông tin công ty"""
    global company_info
    
    if company_info is None:
        raise HTTPException(status_code=404, detail="Chưa có thông tin công ty")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(company_info, key, value)
    
    return company_info


# -------------------------------------------------
# WAREHOUSES
# -------------------------------------------------

@app.get("/warehouses", response_model=List[schemas.Warehouse])
def get_warehouses():
    """Lấy danh sách tất cả kho"""
    warehouses = list(warehouses_store.values())
    # Đánh dấu kho active
    for wh in warehouses:
        wh.is_active = (wh.id == active_warehouse_id)
    return warehouses


@app.get("/warehouses/active", response_model=schemas.Warehouse | None)
def get_active_warehouse():
    """Lấy kho đang active"""
    if active_warehouse_id is None:
        return None
    return warehouses_store.get(active_warehouse_id)


@app.post("/warehouses", response_model=schemas.Warehouse)
def create_warehouse(data: schemas.WarehouseCreate):
    """Tạo kho mới"""
    global active_warehouse_id
    
    # Kiểm tra code trùng
    for wh in warehouses_store.values():
        if wh.code == data.code:
            raise HTTPException(
                status_code=400,
                detail=f"Mã kho '{data.code}' đã tồn tại"
            )
    
    new_id = _next_warehouse_id()
    warehouse = schemas.Warehouse(
        id=new_id,
        created_at=datetime.now(timezone.utc),
        is_active=False,
        **data.model_dump()
    )
    warehouses_store[new_id] = warehouse
    
    # Nếu chưa có kho nào active, set kho mới làm active
    if active_warehouse_id is None:
        active_warehouse_id = new_id
        warehouse.is_active = True
    
    return warehouse


@app.put("/warehouses/{warehouse_id}", response_model=schemas.Warehouse)
def update_warehouse(warehouse_id: int, data: schemas.WarehouseUpdate):
    """Cập nhật thông tin kho"""
    if warehouse_id not in warehouses_store:
        raise HTTPException(status_code=404, detail="Không tìm thấy kho")
    
    warehouse = warehouses_store[warehouse_id]
    
    # Kiểm tra code trùng (nếu có thay đổi code)
    if data.code and data.code != warehouse.code:
        for wh_id, wh in warehouses_store.items():
            if wh_id != warehouse_id and wh.code == data.code:
                raise HTTPException(
                    status_code=400,
                    detail=f"Mã kho '{data.code}' đã tồn tại"
                )
    
    for key, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(warehouse, key, value)
    
    return warehouse


@app.delete("/warehouses/{warehouse_id}")
def delete_warehouse(warehouse_id: int):
    """Xóa kho"""
    global active_warehouse_id
    
    if warehouse_id not in warehouses_store:
        raise HTTPException(status_code=404, detail="Không tìm thấy kho")
    
    del warehouses_store[warehouse_id]
    
    # Nếu xóa kho đang active, chuyển sang kho đầu tiên còn lại
    if active_warehouse_id == warehouse_id:
        if warehouses_store:
            active_warehouse_id = next(iter(warehouses_store.keys()))
        else:
            active_warehouse_id = None
    
    return {"message": "Đã xóa kho"}


@app.put("/warehouses/{warehouse_id}/set-active")
def set_active_warehouse(warehouse_id: int):
    """Đặt kho làm active"""
    global active_warehouse_id
    
    if warehouse_id not in warehouses_store:
        raise HTTPException(status_code=404, detail="Không tìm thấy kho")
    
    active_warehouse_id = warehouse_id
    return {"message": "Đã đổi kho active", "warehouse_id": warehouse_id}

