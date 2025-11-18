# app/main.py
from typing import List, Any, Dict

from fastapi import FastAPI, HTTPException, status
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
import requests
from datetime import datetime, timezone

from . import schemas
from .config import FIREBASE_API_KEY
from .gemini_client import generate_reply, is_configured as gemini_ready, MODEL_NAME

# =============================================================
# In-memory stores (Firebase DB sẽ thay thế sau) - Tạm thời
# =============================================================
suppliers_store: Dict[int, schemas.Supplier] = {}
items_store: Dict[int, schemas.Item] = {}
stock_transactions_store: List[schemas.StockTransaction] = []

_supplier_id = 1
_item_id = 1
_tx_id = 1

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

app = FastAPI(title="N3T KhoHang API", version="0.1.0")

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
