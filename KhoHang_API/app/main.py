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
from .schemas import ChatMessage, ChatHistory, ChatRequest

# =============================================================
# In-memory stores (Thêm store cho Chat)
# =============================================================
# Key: user_id, Value: List[ChatMessage]
chat_store: Dict[str, List[schemas.ChatMessage]] = {}

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
# CHAT CRUD API
# -------------------------------------------------

# 1. CREATE & READ (Gửi tin nhắn và nhận phản hồi, đồng thời lưu lịch sử)
@app.post("/chat/send", response_model=schemas.ChatHistory)
def send_chat_message(req: schemas.ChatRequest):
    if not gemini_ready():
        raise HTTPException(status_code=501, detail="Gemini chưa được cấu hình")

    # 1. Khởi tạo lịch sử nếu chưa có
    if req.user_id not in chat_store:
        chat_store[req.user_id] = []

    # 2. Lưu tin nhắn của User
    user_msg = schemas.ChatMessage(
        role="user",
        content=req.message,
        timestamp=datetime.now(timezone.utc)
    )
    chat_store[req.user_id].append(user_msg)

    # 3. Gọi Gemini (Có thể gửi kèm lịch sử context nếu muốn bot thông minh hơn)
    # Ở đây demo gửi prompt đơn lẻ, nhưng thực tế nên build context từ chat_store
    try:
        ai_reply_text = generate_reply(req.message, req.system_instruction)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 4. Lưu phản hồi của AI
    ai_msg = schemas.ChatMessage(
        role="model",
        content=ai_reply_text,
        timestamp=datetime.now(timezone.utc)
    )
    chat_store[req.user_id].append(ai_msg)

    return schemas.ChatHistory(user_id=req.user_id, messages=chat_store[req.user_id])

# 2. READ (Lấy toàn bộ lịch sử chat của User)
@app.get("/chat/history/{user_id}", response_model=schemas.ChatHistory)
def get_chat_history(user_id: str):
    messages = chat_store.get(user_id, [])
    return schemas.ChatHistory(user_id=user_id, messages=messages)

# 3. DELETE (Xóa lịch sử chat)
@app.delete("/chat/history/{user_id}", status_code=204)
def clear_chat_history(user_id: str):
    if user_id in chat_store:
        chat_store[user_id] = [] # Hoặc del chat_store[user_id]
    return

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
# # app/main.py
# import firebase_admin
# from firebase_admin import credentials, firestore
# from fastapi import FastAPI, HTTPException, status
# from fastapi.responses import PlainTextResponse
# from fastapi.middleware.cors import CORSMiddleware
# from typing import List, Any, Dict
# from datetime import datetime, timezone
# import requests

# from . import schemas
# from .config import FIREBASE_API_KEY
# from .gemini_client import generate_reply, is_configured as gemini_ready, MODEL_NAME

# # =============================================================
# # CẤU HÌNH FIREBASE FIRESTORE
# # =============================================================
# # Đảm bảo file serviceAccountKey.json nằm cùng thư mục với main.py
# # Hoặc đường dẫn tuyệt đối tới file đó.
# try:
#     cred = credentials.Certificate("app/serviceAccountKey.json")
#     firebase_admin.initialize_app(cred)
#     db = firestore.client()
#     print(">>> Kết nối Firestore thành công!")
# except Exception as e:
#     print(f">>> Lỗi kết nối Firestore: {e}")
#     print(">>> Vui lòng kiểm tra file serviceAccountKey.json")

# # =============================================================
# # In-memory stores (Chỉ dùng cho Chat - Dữ liệu tạm)
# # =============================================================
# chat_store: Dict[str, List[schemas.ChatMessage]] = {}

# app = FastAPI(title="N3T KhoHang API", version="0.1.0")

# # CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # -------------------------------------------------
# # ROOT
# # -------------------------------------------------
# @app.get("/")
# def root():
#     return {"message": "N3T KhoHang API is running with Firestore"}

# # -------------------------------------------------
# # AUTH (Firebase REST API - Giữ nguyên logic cũ)
# # -------------------------------------------------
# @app.post("/auth/register", response_model=schemas.AuthResponse)
# def register_user(payload: schemas.AuthRegisterRequest):
#     url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={FIREBASE_API_KEY}"
#     data = {
#         "email": payload.email,
#         "password": payload.password,
#         "returnSecureToken": True,
#     }
#     if payload.full_name:
#         data["displayName"] = payload.full_name

#     r = requests.post(url, json=data)
#     if not r.ok:
#         err = r.json()
#         msg = err.get("error", {}).get("message", "FIREBASE_SIGNUP_FAILED")
#         raise HTTPException(status_code=400, detail=msg)

#     fb = r.json()
#     user = schemas.User(
#         id=fb.get("localId", ""),
#         email=fb["email"],
#         name=fb.get("displayName"),
#     )
#     return schemas.AuthResponse(
#         user=user,
#         token=fb["idToken"],
#         refresh_token=fb.get("refreshToken"),
#     )

# @app.post("/auth/login", response_model=schemas.AuthResponse)
# def login_user(payload: schemas.AuthLoginRequest):
#     url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
#     data = {
#         "email": payload.email,
#         "password": payload.password,
#         "returnSecureToken": True,
#     }

#     r = requests.post(url, json=data)
#     if not r.ok:
#         err = r.json()
#         msg = err.get("error", {}).get("message", "FIREBASE_LOGIN_FAILED")
#         raise HTTPException(status_code=400, detail=msg)

#     fb = r.json()
#     user = schemas.User(
#         id=fb.get("localId", ""),
#         email=fb["email"],
#         name=fb.get("displayName"),
#     )
#     return schemas.AuthResponse(
#         user=user,
#         token=fb["idToken"],
#         refresh_token=fb.get("refreshToken"),
#     )

# @app.post("/auth/change-password")
# def change_password(payload: schemas.AuthChangePasswordRequest):
#     login_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
#     login_data = {"email": payload.email, "password": payload.old_password, "returnSecureToken": True}
    
#     r_login = requests.post(login_url, json=login_data)
#     if not r_login.ok:
#         raise HTTPException(status_code=400, detail="Mật khẩu cũ không chính xác")
    
#     id_token = r_login.json().get("idToken")

#     update_url = f"https://identitytoolkit.googleapis.com/v1/accounts:update?key={FIREBASE_API_KEY}"
#     update_data = {"idToken": id_token, "password": payload.new_password, "returnSecureToken": False}
    
#     r_update = requests.post(update_url, json=update_data)
#     if not r_update.ok:
#         err = r_update.json()
#         msg = err.get("error", {}).get("message", "CHANGE_PASSWORD_FAILED")
#         raise HTTPException(status_code=400, detail=msg)

#     return {"message": "Đổi mật khẩu thành công"}

# @app.post("/auth/logout", status_code=200)
# def logout_user():
#     return {"message": "logged out"}

# @app.post("/auth/forgot-password", status_code=200)
# def forgot_password(payload: schemas.AuthForgotPasswordRequest):
#     url = f"https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={FIREBASE_API_KEY}"
#     data = {"requestType": "PASSWORD_RESET", "email": payload.email}
#     r = requests.post(url, json=data)
#     if not r.ok:
#         err = r.json()
#         msg = err.get("error", {}).get("message", "FIREBASE_ERROR")
#         if msg == "EMAIL_NOT_FOUND":
#             raise HTTPException(status_code=404, detail="Email không tồn tại")
#         raise HTTPException(status_code=400, detail=msg)
#     return {"message": "Đã gửi email đặt lại mật khẩu."}

# # -------------------------------------------------
# # SUPPLIERS (FIRESTORE)
# # -------------------------------------------------
# @app.get("/suppliers", response_model=List[schemas.Supplier])
# def get_suppliers():
#     docs = db.collection('suppliers').stream()
#     result = []
#     for doc in docs:
#         data = doc.to_dict()
#         result.append(data)
#     return result

# @app.post("/suppliers", response_model=schemas.Supplier)
# def create_supplier(supplier: schemas.SupplierCreate):
#     new_id = int(datetime.now().timestamp())
#     data = supplier.model_dump()
#     data['id'] = new_id
#     db.collection('suppliers').document(str(new_id)).set(data)
#     return data

# # -------------------------------------------------
# # ITEMS (FIRESTORE)
# # -------------------------------------------------
# @app.get("/items", response_model=List[schemas.Item])
# def get_items():
#     docs = db.collection('products').stream()
#     items = []
#     for doc in docs:
#         items.append(doc.to_dict())
#     return items

# @app.post("/items", response_model=schemas.Item)
# def create_item(item: schemas.ItemCreate):
#     existing = db.collection('products').where('sku', '==', item.sku).limit(1).get()
#     if len(existing) > 0:
#         raise HTTPException(status_code=400, detail="SKU đã tồn tại")
    
#     new_id = int(datetime.now().timestamp())
#     item_data = item.model_dump()
#     item_data['id'] = new_id
    
#     db.collection('products').document(str(new_id)).set(item_data)
#     return item_data

# @app.put("/items/{item_id}", response_model=schemas.Item)
# def update_item(item_id: int, item: schemas.ItemUpdate):
#     doc_ref = db.collection('products').document(str(item_id))
#     if not doc_ref.get().exists:
#         raise HTTPException(status_code=404, detail="Không tìm thấy hàng hoá")
    
#     data = item.model_dump(exclude_unset=True)
#     doc_ref.update(data)
#     return doc_ref.get().to_dict()

# @app.delete("/items/{item_id}", status_code=204)
# def delete_item(item_id: int):
#     doc_ref = db.collection('products').document(str(item_id))
#     if not doc_ref.get().exists:
#         raise HTTPException(status_code=404, detail="Không tìm thấy hàng hoá")
#     doc_ref.delete()
#     return

# # -------------------------------------------------
# # STOCK TRANSACTIONS (FIRESTORE)
# # -------------------------------------------------
# @app.get("/stock/transactions", response_model=List[schemas.StockTransaction])
# def get_transactions():
#     docs = db.collection('stock_transactions').order_by('timestamp', direction=firestore.Query.DESCENDING).stream()
#     txs = []
#     for doc in docs:
#         txs.append(doc.to_dict())
#     return txs

# @app.post("/stock/transactions", response_model=schemas.StockTransaction)
# def create_transaction(tx: schemas.StockTransactionCreate):
#     item_ref = db.collection('products').document(str(tx.item_id))
#     item_doc = item_ref.get()
#     if not item_doc.exists:
#         raise HTTPException(status_code=404, detail="Không tìm thấy hàng hoá")
    
#     if tx.type == "out":
#         current_qty = item_doc.get('quantity')
#         if current_qty < tx.quantity:
#              raise HTTPException(status_code=400, detail=f"Không đủ tồn kho (Còn: {current_qty})")

#     tx_id = int(datetime.now().timestamp() * 1000)
#     new_tx = schemas.StockTransaction(
#         id=tx_id,
#         type=tx.type,
#         item_id=tx.item_id,
#         quantity=tx.quantity,
#         note=tx.note,
#         timestamp=datetime.now(timezone.utc),
#     )
    
#     db.collection('stock_transactions').document(str(tx_id)).set(new_tx.model_dump())
#     return new_tx

# # -------------------------------------------------
# # DASHBOARD (FIRESTORE)
# # -------------------------------------------------
# @app.get("/dashboard/stats", response_model=schemas.DashboardStats)
# def get_dashboard_stats():
#     item_docs = db.collection('products').stream()
#     items = [doc.to_dict() for doc in item_docs]
    
#     total_items = len(items)
#     low_stock_count = sum(1 for i in items if i.get('quantity', 0) < 10)
#     total_value = sum(i.get('quantity', 0) * i.get('price', 0) for i in items)
    
#     tx_docs = db.collection('stock_transactions').order_by('timestamp', direction=firestore.Query.DESCENDING).limit(10).stream()
#     recent_transactions = [doc.to_dict() for doc in tx_docs]

#     return schemas.DashboardStats(
#         total_items=total_items,
#         low_stock_count=low_stock_count,
#         total_value=total_value,
#         recent_transactions=recent_transactions,
#     )

# # -------------------------------------------------
# # CHAT & AI
# # -------------------------------------------------
# @app.post("/chat/send", response_model=schemas.ChatHistory)
# def send_chat_message(req: schemas.ChatRequest):
#     if not gemini_ready():
#         raise HTTPException(status_code=501, detail="Gemini chưa cấu hình")
    
#     if req.user_id not in chat_store:
#         chat_store[req.user_id] = []

#     user_msg = schemas.ChatMessage(role="user", content=req.message, timestamp=datetime.now(timezone.utc))
#     chat_store[req.user_id].append(user_msg)

#     try:
#         reply = generate_reply(req.message, req.system_instruction)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

#     ai_msg = schemas.ChatMessage(role="model", content=reply, timestamp=datetime.now(timezone.utc))
#     chat_store[req.user_id].append(ai_msg)
#     return schemas.ChatHistory(user_id=req.user_id, messages=chat_store[req.user_id])

# @app.get("/chat/history/{user_id}", response_model=schemas.ChatHistory)
# def get_chat_history(user_id: str):
#     return schemas.ChatHistory(user_id=user_id, messages=chat_store.get(user_id, []))

# @app.delete("/chat/history/{user_id}", status_code=204)
# def clear_chat_history(user_id: str):
#     if user_id in chat_store:
#         chat_store[user_id] = []
#     return

# @app.post("/ai/chat", response_model=schemas.AIChatResponse)
# def ai_chat(req: schemas.AIChatRequest):
#     if not gemini_ready():
#         raise HTTPException(status_code=501, detail="Gemini chưa cấu hình")
#     try:
#         reply = generate_reply(req.prompt, req.system_instruction)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
#     return schemas.AIChatResponse(reply=reply, model=MODEL_NAME)

# @app.post("/ai/chat-md", response_class=PlainTextResponse)
# def ai_chat_markdown(req: schemas.AIChatRequest):
#     if not gemini_ready():
#         raise HTTPException(status_code=501, detail="Gemini chưa cấu hình")
#     try:
#         reply = generate_reply(req.prompt, req.system_instruction)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
#     return PlainTextResponse(reply, media_type="text/markdown")
