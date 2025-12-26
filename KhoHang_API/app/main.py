# app/main.py
from typing import List, Any, Dict
import shutil
from pathlib import Path
import uuid
import io
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, status, File, UploadFile, Depends
from fastapi.responses import PlainTextResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import requests
from PIL import Image
from sqlalchemy import func
from sqlalchemy.orm import Session

from . import schemas
from .config import FIREBASE_API_KEY
from .gemini_client import generate_reply, is_configured as gemini_ready, MODEL_NAME, QuotaExceededError
from .export_service import VoucherExportRequest, export_to_excel, export_to_pdf
from .database import (
    get_db, SupplierModel, ItemModel, StockTransactionModel, WarehouseModel,
    CompanyInfoModel, StockInRecordModel, StockOutRecordModel, UserModel, get_datadir
)
from .auth_middleware import require_auth, UserModel as AuthUserModel
from .db_helpers import (
    supplier_model_to_schema, supplier_schema_to_dict,
    item_model_to_schema, item_schema_to_dict,
    warehouse_model_to_schema, warehouse_schema_to_dict,
    stock_transaction_model_to_schema,
    company_info_model_to_schema,
    stock_in_record_model_to_schema,
    stock_out_record_model_to_schema,
)

DATA_DIR = get_datadir()
UPLOADS_DIR = DATA_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
LOGO_DIR = UPLOADS_DIR / "logos"
LOGO_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="N3T KhoHang API", version="0.1.0")

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
# AUTH (Firebase + Local DB Sync)
# -------------------------------------------------

@app.post("/auth/register", response_model=schemas.AuthResponse)
def register_user(payload: schemas.AuthRegisterRequest, db: Session = Depends(get_db)):
    """Đăng ký tài khoản mới qua Firebase Auth và lưu vào DB local"""
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    fb = r.json()
    user_id = fb.get("localId", "")
    email = fb["email"]
    display_name = fb.get("displayName")

    # Lưu user vào database local
    new_user = UserModel(
        id=user_id,
        email=email,
        name=display_name,
        role="staff"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    user = schemas.User(id=user_id, email=email, name=display_name)
    return schemas.AuthResponse(
        user=user,
        token=fb["idToken"],
        refresh_token=fb.get("refreshToken"),
    )


@app.post("/auth/login", response_model=schemas.AuthResponse)
def login_user(payload: schemas.AuthLoginRequest, db: Session = Depends(get_db)):
    """Đăng nhập bằng email/password qua Firebase Auth và đồng bộ DB local"""
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
    data: Dict[str, Any] = {
        "email": payload.email,
        "password": payload.password,
        "returnSecureToken": True,
    }

    r = requests.post(url, json=data)
    if not r.ok:
        err = r.json()
        msg = err.get("error", {}).get("message", "FIREBASE_LOGIN_FAILED")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    fb = r.json()
    user_id = fb.get("localId", "")
    email = fb["email"]
    display_name = fb.get("displayName")

    # Đồng bộ user vào database local
    db_user = db.query(UserModel).filter(UserModel.id == user_id).first()
    
    if not db_user:
        new_user = UserModel(
            id=user_id,
            email=email,
            name=display_name,
            role="staff"
        )
        db.add(new_user)
        db.commit()
    else:
        # Cập nhật tên nếu có thay đổi từ Firebase
        if display_name and db_user.name != display_name:
            db_user.name = display_name
            db.commit()

    user = schemas.User(id=user_id, email=email, name=display_name)
    return schemas.AuthResponse(
        user=user,
        token=fb["idToken"],
        refresh_token=fb.get("refreshToken"),
    )

@app.post("/auth/change-password")
def change_password(payload: schemas.AuthChangePasswordRequest):
    """Đổi mật khẩu"""
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
    return {"message": "logged out"}


@app.post("/auth/forgot-password", status_code=200)
def forgot_password(payload: schemas.AuthForgotPasswordRequest):
    """Gửi email đặt lại mật khẩu"""
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={FIREBASE_API_KEY}"
    data = {
        "requestType": "PASSWORD_RESET",
        "email": payload.email,
    }

    r = requests.post(url, json=data)
    if not r.ok:
        err = r.json()
        msg = err.get("error", {}).get("message", "FIREBASE_ERROR")
        if msg == "EMAIL_NOT_FOUND":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email không tồn tại")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    
    return {"message": "Email đặt lại mật khẩu đã được gửi."}


# -------------------------------------------------
# SUPPLIERS
# -------------------------------------------------

@app.get("/suppliers", response_model=List[schemas.Supplier])
def get_suppliers(db: Session = Depends(get_db)):
    suppliers = db.query(SupplierModel).all()
    return [supplier_model_to_schema(s) for s in suppliers]


@app.post("/suppliers", response_model=schemas.Supplier)
def create_supplier(
    supplier: schemas.SupplierCreate, 
    db: Session = Depends(get_db),
    current_user: AuthUserModel = Depends(require_auth)
):
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Không có quyền tạo nhà cung cấp")
    
    existing = db.query(SupplierModel).filter(SupplierModel.name == supplier.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Nhà cung cấp đã tồn tại")
    
    db_supplier = SupplierModel(**supplier_schema_to_dict(supplier))
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return supplier_model_to_schema(db_supplier)


@app.put("/suppliers/{supplier_id}", response_model=schemas.Supplier)
def update_supplier(
    supplier_id: int, 
    supplier: schemas.SupplierUpdate, 
    db: Session = Depends(get_db),
    current_user: AuthUserModel = Depends(require_auth)
):
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Không có quyền cập nhật nhà cung cấp")
    
    db_supplier = db.query(SupplierModel).filter(SupplierModel.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhà cung cấp")
    
    update_data = supplier.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_supplier, key, value)
    
    db.commit()
    db.refresh(db_supplier)
    return supplier_model_to_schema(db_supplier)


@app.delete("/suppliers/{supplier_id}", status_code=204)
def delete_supplier(
    supplier_id: int, 
    db: Session = Depends(get_db),
    current_user: AuthUserModel = Depends(require_auth)
):
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Không có quyền xóa nhà cung cấp")
    
    db_supplier = db.query(SupplierModel).filter(SupplierModel.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhà cung cấp")
    
    db.delete(db_supplier)
    db.commit()
    return None


@app.get("/suppliers/{supplier_id}/transactions")
def get_supplier_transactions(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(SupplierModel).filter(SupplierModel.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhà cung cấp")
    
    db_stock_in_records = db.query(StockInRecordModel).filter(
        StockInRecordModel.supplier == supplier.name
    ).all()
    stock_in_records = [stock_in_record_model_to_schema(r) for r in db_stock_in_records]
    
    return {
        "stock_in": stock_in_records,
        "stock_out": [],
        "total_transactions": len(stock_in_records),
        "outstanding_debt": supplier.outstanding_debt or 0.0
    }

# -------------------------------------------------
# ITEMS
# -------------------------------------------------

@app.get("/items", response_model=List[schemas.Item])
def get_items(db: Session = Depends(get_db)):
    items = db.query(ItemModel).all()
    return [item_model_to_schema(i) for i in items]


@app.post("/items", response_model=schemas.Item)
def create_item(
    item: schemas.ItemCreate, 
    db: Session = Depends(get_db),
    current_user: AuthUserModel = Depends(require_auth) 
):
    existing = db.query(ItemModel).filter(ItemModel.sku == item.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU đã tồn tại")
    
    db_item = ItemModel(**item_schema_to_dict(item))
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return item_model_to_schema(db_item)


@app.put("/items/{item_id}", response_model=schemas.Item)
def update_item(
    item_id: int, 
    item: schemas.ItemUpdate, 
    db: Session = Depends(get_db),
    current_user: AuthUserModel = Depends(require_auth)
):
    db_item = db.query(ItemModel).filter(ItemModel.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Không tìm thấy hàng hoá")
    
    update_data = item.model_dump(exclude_unset=True)
    if 'sku' in update_data and update_data['sku'] != db_item.sku:
        existing = db.query(ItemModel).filter(ItemModel.sku == update_data['sku']).first()
        if existing:
            raise HTTPException(status_code=400, detail="SKU đã tồn tại")
    
    for key, value in update_data.items():
        setattr(db_item, key, value)
    
    db_item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_item)
    return item_model_to_schema(db_item)


@app.delete("/items/{item_id}", status_code=204)
def delete_item(
    item_id: int, 
    db: Session = Depends(get_db),
    current_user: AuthUserModel = Depends(require_auth)
):
    db_item = db.query(ItemModel).filter(ItemModel.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Không tìm thấy hàng hoá")
    
    db.delete(db_item)
    db.commit()
    return None


@app.get("/items/alerts", response_model=List[schemas.ItemAlert])
def get_items_alerts(db: Session = Depends(get_db)):
    """Lấy danh sách cảnh báo tồn kho"""
    items = db.query(ItemModel).all()
    alerts = []
    
    for item in items:
        current_stock = item.quantity or 0
        min_stock = item.min_stock or 10
        max_stock = max(min_stock * 10, 100)
        
        if current_stock <= 0 or current_stock < min_stock * 0.2:
            status = "critical"
        elif current_stock < min_stock * 0.5:
            status = "warning"
        elif current_stock < min_stock:
            status = "low"
        elif current_stock > max_stock:
            status = "overstock"
        else:
            continue
        
        alert = schemas.ItemAlert(
            id=str(item.id),
            name=item.name,
            sku=item.sku,
            currentStock=current_stock,
            minStock=min_stock,
            maxStock=max_stock,
            category=item.category,
            lastUpdate=item.updated_at.isoformat() if item.updated_at else item.created_at.isoformat(),
            status=status
        )
        alerts.append(alert)
    
    return alerts


@app.get("/items/top-items", response_model=List[schemas.TopItem])
def get_top_items(db: Session = Depends(get_db)):
    items = db.query(ItemModel).order_by(ItemModel.quantity.desc()).limit(10).all()
    return [schemas.TopItem(name=item.name, value=item.quantity or 0) for item in items]


@app.get("/items/monthly-trend", response_model=List[schemas.MonthlyTrend])
def get_monthly_trend(db: Session = Depends(get_db)):
    from datetime import timedelta
    month_names = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"]
    twelve_months_ago = datetime.now(timezone.utc) - timedelta(days=365)
    
    transactions = db.query(StockTransactionModel).filter(
        StockTransactionModel.timestamp >= twelve_months_ago,
        StockTransactionModel.type == "in"
    ).all()
    
    monthly_data = {month: 0 for month in month_names}
    for tx in transactions:
        month_key = tx.timestamp.month - 1
        if 0 <= month_key < 12:
            monthly_data[month_names[month_key]] += tx.quantity
    
    return [schemas.MonthlyTrend(month=month, value=monthly_data[month]) for month in month_names]


@app.get("/items/category-distribution", response_model=List[schemas.CategoryDistribution])
def get_category_distribution(db: Session = Depends(get_db)):
    items = db.query(ItemModel).all()
    category_data = {}
    colors = ["#00BCD4", "#4CAF50", "#FF9800", "#F44336", "#9C27B0", "#2196F3", "#FFC107", "#795548", "#607D8B", "#E91E63"]
    
    for item in items:
        category = item.category or "Khác"
        if category not in category_data:
            category_data[category] = 0
        category_data[category] += item.quantity or 0
    
    result = []
    for idx, (category, total_qty) in enumerate(sorted(category_data.items(), key=lambda x: x[1], reverse=True)):
        result.append(schemas.CategoryDistribution(
            name=category, value=total_qty, color=colors[idx % len(colors)]
        ))
    return result


# -------------------------------------------------
# STOCK TRANSACTIONS
# -------------------------------------------------

@app.get("/stock/transactions", response_model=List[schemas.StockTransaction])
def get_transactions(db: Session = Depends(get_db)):
    transactions = db.query(StockTransactionModel).order_by(StockTransactionModel.timestamp.desc()).all()
    return [stock_transaction_model_to_schema(t) for t in transactions]


@app.post("/stock/transactions", response_model=schemas.StockTransaction)
def create_transaction(
    tx: schemas.StockTransactionCreate, 
    db: Session = Depends(get_db),
    current_user: AuthUserModel = Depends(require_auth)
):
    if current_user.role not in ['admin', 'manager', 'staff']:
        raise HTTPException(status_code=403, detail="Không có quyền tạo giao dịch kho")
    
    db_item = db.query(ItemModel).filter(ItemModel.id == tx.item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Không tìm thấy hàng hoá")
    
    current_qty = db_item.quantity or 0
    if tx.type == "in":
        new_qty = current_qty + tx.quantity
    elif tx.type == "out":
        if current_qty < tx.quantity:
            raise HTTPException(status_code=400, detail="Không đủ tồn kho để xuất")
        new_qty = current_qty - tx.quantity
    else:
        raise HTTPException(status_code=400, detail="Loại giao dịch phải là 'in' hoặc 'out'")
    
    db_item.quantity = new_qty
    db_item.updated_at = datetime.now(timezone.utc)
    
    db_tx = StockTransactionModel(
        type=tx.type,
        item_id=tx.item_id,
        quantity=tx.quantity,
        note=tx.note,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return stock_transaction_model_to_schema(db_tx)


# -------------------------------------------------
# DASHBOARD
# -------------------------------------------------

@app.get("/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    items = db.query(ItemModel).all()
    total_items = len(items)
    low_stock_count = sum(1 for i in items if (i.quantity or 0) < (i.min_stock or 10))
    total_value = sum((i.quantity or 0) * i.price for i in items)
    
    recent_transactions = db.query(StockTransactionModel).order_by(
        StockTransactionModel.timestamp.desc()
    ).limit(10).all()
    
    return schemas.DashboardStats(
        total_items=total_items,
        low_stock_count=low_stock_count,
        total_value=total_value,
        recent_transactions=[stock_transaction_model_to_schema(t) for t in recent_transactions],
    )


# -------------------------------------------------
# AI CHAT
# -------------------------------------------------

@app.post("/ai/chat", response_model=schemas.AIChatResponse)
def ai_chat(req: schemas.AIChatRequest):
    if not gemini_ready():
        raise HTTPException(status_code=501, detail="Gemini API chưa được cấu hình")
    try:
        reply = generate_reply(req.prompt, req.system_instruction)
    except QuotaExceededError as e:
        headers = {}
        if e.retry_after:
            headers["Retry-After"] = str(int(e.retry_after))
        raise HTTPException(status_code=429, detail=str(e), headers=headers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {e}")
    return schemas.AIChatResponse(reply=reply, model=MODEL_NAME)


@app.post(
    "/ai/chat-md",
    response_class=PlainTextResponse,
    responses={200: {"content": {"text/markdown": {}}}},
)
def ai_chat_markdown(req: schemas.AIChatRequest):
    if not gemini_ready():
        raise HTTPException(status_code=501, detail="Gemini API chưa được cấu hình")
    try:
        reply = generate_reply(req.prompt, req.system_instruction)
    except QuotaExceededError as e:
        headers = {}
        if e.retry_after:
            headers["Retry-After"] = str(int(e.retry_after))
        raise HTTPException(status_code=429, detail=str(e), headers=headers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {e}")
    return PlainTextResponse(reply, media_type="text/markdown")


# -------------------------------------------------
# STOCK IN
# -------------------------------------------------

def _next_stock_in_id(warehouse_code: str, date_str: str, db: Session) -> str:
    try:
        date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except:
        date_obj = datetime.now()
    
    month_year_key = date_obj.strftime("%m%y")
    prefix = f"{warehouse_code}_PN_{month_year_key}_"
    
    count = db.query(func.count(StockInRecordModel.id)).filter(
        StockInRecordModel.id.like(f"{prefix}%")
    ).scalar() or 0
    
    return f"{prefix}{count + 1:04d}"


@app.get("/stock/in", response_model=List[schemas.StockInRecord])
def get_stock_in_records(db: Session = Depends(get_db)):
    records = db.query(StockInRecordModel).order_by(StockInRecordModel.created_at.desc()).all()
    return [stock_in_record_model_to_schema(r) for r in records]


@app.get("/stock/in/{record_id}", response_model=schemas.StockInRecord)
def get_stock_in_record(record_id: str, db: Session = Depends(get_db)):
    record = db.query(StockInRecordModel).filter(StockInRecordModel.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu nhập kho")
    return stock_in_record_model_to_schema(record)


@app.post("/stock/in", response_model=schemas.StockInRecord, status_code=201)
def create_stock_in(
    data: schemas.StockInBatchCreate, 
    db: Session = Depends(get_db),
    current_user: AuthUserModel = Depends(require_auth)
):
    if current_user.role not in ['admin', 'manager', 'staff']:
        raise HTTPException(status_code=403, detail="Không có quyền tạo phiếu nhập kho")
    
    record_id = _next_stock_in_id(data.warehouse_code, data.date, db)
    total_qty = sum(item.quantity for item in data.items)
    total_amt = sum(item.quantity * item.price for item in data.items)
    items_json = [item.model_dump() for item in data.items]
    
    db_record = StockInRecordModel(
        id=record_id,
        warehouse_code=data.warehouse_code,
        supplier=data.supplier,
        date=data.date,
        note=data.note or "",
        tax_rate=data.tax_rate or 0.0,
        payment_method=getattr(data, 'payment_method', 'tiền_mặt') or 'tiền_mặt',
        payment_bank_account=getattr(data, 'payment_bank_account', '') or '',
        payment_bank_name=getattr(data, 'payment_bank_name', '') or '',
        items=items_json,
        total_quantity=total_qty,
        total_amount=total_amt,
        status="completed"
    )
    
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return stock_in_record_model_to_schema(db_record)


@app.delete("/stock/in/{record_id}", status_code=204)
def delete_stock_in(
    record_id: str, 
    db: Session = Depends(get_db),
    current_user: AuthUserModel = Depends(require_auth)
):
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Không có quyền xóa phiếu nhập kho")
    record = db.query(StockInRecordModel).filter(StockInRecordModel.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu nhập kho")
    
    db.delete(record)
    db.commit()
    return None


# -------------------------------------------------
# STOCK OUT
# -------------------------------------------------

def _next_stock_out_id(warehouse_code: str, date_str: str, db: Session) -> str:
    try:
        date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except:
        date_obj = datetime.now()
    
    month_year_key = date_obj.strftime("%m%y")
    prefix = f"{warehouse_code}_PX_{month_year_key}_"
    
    count = db.query(func.count(StockOutRecordModel.id)).filter(
        StockOutRecordModel.id.like(f"{prefix}%")
    ).scalar() or 0
    
    return f"{prefix}{count + 1:04d}"


@app.get("/stock/out", response_model=List[schemas.StockOutRecord])
def get_stock_out_records(db: Session = Depends(get_db)):
    records = db.query(StockOutRecordModel).order_by(StockOutRecordModel.created_at.desc()).all()
    return [stock_out_record_model_to_schema(r) for r in records]


@app.get("/stock/out/{record_id}", response_model=schemas.StockOutRecord)
def get_stock_out_record(record_id: str, db: Session = Depends(get_db)):
    record = db.query(StockOutRecordModel).filter(StockOutRecordModel.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu xuất kho")
    return stock_out_record_model_to_schema(record)


@app.post("/stock/out", response_model=schemas.StockOutRecord, status_code=201)
def create_stock_out(
    data: schemas.StockOutBatchCreate, 
    db: Session = Depends(get_db),
    current_user: AuthUserModel = Depends(require_auth)
):
    if current_user.role not in ['admin', 'manager', 'staff']:
        raise HTTPException(status_code=403, detail="Không có quyền tạo phiếu xuất kho")
    
    record_id = _next_stock_out_id(data.warehouse_code, data.date, db)
    total_qty = sum(item.quantity for item in data.items)
    total_amt = None
    if data.purpose == "Bán hàng":
        total_amt = sum(item.quantity * (item.sell_price or 0) for item in data.items)
    
    items_json = [item.model_dump() for item in data.items]
    
    db_record = StockOutRecordModel(
        id=record_id,
        warehouse_code=data.warehouse_code,
        recipient=data.recipient,
        purpose=data.purpose,
        date=data.date,
        note=data.note or "",
        tax_rate=data.tax_rate or 0.0,
        payment_method=getattr(data, 'payment_method', 'tiền_mặt') or 'tiền_mặt',
        payment_bank_account=getattr(data, 'payment_bank_account', '') or '',
        payment_bank_name=getattr(data, 'payment_bank_name', '') or '',
        items=items_json,
        total_quantity=total_qty,
        total_amount=total_amt,
        status="completed"
    )
    
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return stock_out_record_model_to_schema(db_record)


@app.delete("/stock/out/{record_id}", status_code=204)
def delete_stock_out(
    record_id: str, 
    db: Session = Depends(get_db),
    current_user: AuthUserModel = Depends(require_auth)
):
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Không có quyền xóa phiếu xuất kho")
    record = db.query(StockOutRecordModel).filter(StockOutRecordModel.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu xuất kho")
    
    db.delete(record)
    db.commit()
    return None


# -------------------------------------------------
# EXPORT
# -------------------------------------------------

@app.post("/export/excel")
def export_voucher_excel(data: VoucherExportRequest):
    try:
        if len(data.items) > 18:
            raise HTTPException(status_code=400, detail="Template chỉ hỗ trợ tối đa 18 dòng hàng hóa")
        
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
    try:
        if len(data.items) > 18:
            raise HTTPException(status_code=400, detail="Template chỉ hỗ trợ tối đa 18 dòng hàng hóa")
        
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
    try:
        MAX_SIZE = 10 * 1024 * 1024
        contents = await file.read()
        
        if len(contents) > MAX_SIZE:
            raise HTTPException(status_code=400, detail="Kích thước file vượt quá 10MB")
        
        try:
            image = Image.open(io.BytesIO(contents))
            width, height = image.size
            if width != height:
                raise HTTPException(status_code=400, detail=f"Ảnh phải vuông (1:1). Hiện tại: {width}x{height}")
            if image.format.lower() not in ['png', 'jpg', 'jpeg', 'webp']:
                raise HTTPException(status_code=400, detail="Chỉ hỗ trợ PNG, JPG, JPEG, WEBP")
        except Exception as e:
            if isinstance(e, HTTPException): raise e
            raise HTTPException(status_code=400, detail="File không phải ảnh hợp lệ")
        
        file_ext = file.filename.split('.')[-1].lower() if file.filename else 'png'
        new_filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = LOGO_DIR / new_filename
        
        with open(file_path, "wb") as f:
            f.write(contents)
        
        return {
            "logo_url": f"/uploads/logos/{new_filename}",
            "filename": new_filename,
            "size": len(contents),
            "dimensions": f"{width}x{height}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi upload logo: {str(e)}")


@app.get("/company", response_model=schemas.CompanyInfo | None)
def get_company_info(db: Session = Depends(get_db)):
    company = db.query(CompanyInfoModel).first()
    if not company:
        return None
    return company_info_model_to_schema(company)


@app.post("/company", response_model=schemas.CompanyInfo)
def create_or_update_company_info(
    data: schemas.CompanyInfoCreate, 
    db: Session = Depends(get_db),
    current_user: AuthUserModel = Depends(require_auth)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Chỉ admin mới có quyền cập nhật thông tin công ty")
    
    company = db.query(CompanyInfoModel).first()
    if company is None:
        company = CompanyInfoModel(**data.model_dump())
        db.add(company)
    else:
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(company, key, value)
        company.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(company)
    return company_info_model_to_schema(company)


@app.put("/company", response_model=schemas.CompanyInfo)
def update_company_info(
    data: schemas.CompanyInfoUpdate, 
    db: Session = Depends(get_db),
    current_user: AuthUserModel = Depends(require_auth)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Chỉ admin mới có quyền cập nhật thông tin công ty")
    
    company = db.query(CompanyInfoModel).first()
    if company is None:
        raise HTTPException(status_code=404, detail="Chưa có thông tin công ty")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(company, key, value)
    company.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(company)
    return company_info_model_to_schema(company)


# -------------------------------------------------
# WAREHOUSES
# -------------------------------------------------

@app.get("/warehouses", response_model=List[schemas.Warehouse])
def get_warehouses(db: Session = Depends(get_db)):
    warehouses = db.query(WarehouseModel).all()
    active_warehouse = db.query(WarehouseModel).filter(WarehouseModel.is_active == True).first()
    active_id = active_warehouse.id if active_warehouse else None
    
    result = []
    for wh in warehouses:
        schema = warehouse_model_to_schema(wh)
        schema.is_active = (wh.id == active_id)
        result.append(schema)
    return result


@app.get("/warehouses/active", response_model=schemas.Warehouse | None)
def get_active_warehouse(db: Session = Depends(get_db)):
    active_warehouse = db.query(WarehouseModel).filter(WarehouseModel.is_active == True).first()
    if not active_warehouse:
        return None
    return warehouse_model_to_schema(active_warehouse)


@app.post("/warehouses", response_model=schemas.Warehouse)
def create_warehouse(
    data: schemas.WarehouseCreate, 
    db: Session = Depends(get_db),
    current_user: AuthUserModel = Depends(require_auth)
):
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Không có quyền tạo kho")
    
    existing = db.query(WarehouseModel).filter(WarehouseModel.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Mã kho '{data.code}' đã tồn tại")
    
    db_warehouse = WarehouseModel(**warehouse_schema_to_dict(data))
    
    active_count = db.query(WarehouseModel).filter(WarehouseModel.is_active == True).count()
    if active_count == 0:
        db_warehouse.is_active = True
    
    db.add(db_warehouse)
    db.commit()
    db.refresh(db_warehouse)
    return warehouse_model_to_schema(db_warehouse)


@app.put("/warehouses/{warehouse_id}", response_model=schemas.Warehouse)
def update_warehouse(
    warehouse_id: int, 
    data: schemas.WarehouseUpdate, 
    db: Session = Depends(get_db),
    current_user: AuthUserModel = Depends(require_auth)
):
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Không có quyền cập nhật kho")
    
    db_warehouse = db.query(WarehouseModel).filter(WarehouseModel.id == warehouse_id).first()
    if not db_warehouse:
        raise HTTPException(status_code=404, detail="Không tìm thấy kho")
    
    if data.code and data.code != db_warehouse.code:
        existing = db.query(WarehouseModel).filter(
            WarehouseModel.code == data.code,
            WarehouseModel.id != warehouse_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Mã kho '{data.code}' đã tồn tại")
    
    update_data = data.model_dump(exclude_unset=True)
    if 'managers' in update_data:
        update_data['managers'] = [m if isinstance(m, dict) else m.model_dump() for m in update_data['managers']]
    
    for key, value in update_data.items():
        if value is not None:
            setattr(db_warehouse, key, value)
    
    db_warehouse.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_warehouse)
    return warehouse_model_to_schema(db_warehouse)


@app.delete("/warehouses/{warehouse_id}")
def delete_warehouse(
    warehouse_id: int, 
    db: Session = Depends(get_db),
    current_user: AuthUserModel = Depends(require_auth)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Chỉ admin mới có quyền xóa kho")
    
    db_warehouse = db.query(WarehouseModel).filter(WarehouseModel.id == warehouse_id).first()
    if not db_warehouse:
        raise HTTPException(status_code=404, detail="Không tìm thấy kho")
    
    was_active = db_warehouse.is_active
    db.delete(db_warehouse)
    
    if was_active:
        first_warehouse = db.query(WarehouseModel).first()
        if first_warehouse:
            first_warehouse.is_active = True
            db.commit()
    
    db.commit()
    return {"message": "Đã xóa kho"}


@app.put("/warehouses/{warehouse_id}/set-active")
def set_active_warehouse(
    warehouse_id: int, 
    db: Session = Depends(get_db),
    current_user: AuthUserModel = Depends(require_auth)
):
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Không có quyền đổi kho active")
    
    db_warehouse = db.query(WarehouseModel).filter(WarehouseModel.id == warehouse_id).first()
    if not db_warehouse:
        raise HTTPException(status_code=404, detail="Không tìm thấy kho")
    
    db.query(WarehouseModel).update({WarehouseModel.is_active: False})
    db_warehouse.is_active = True
    db.commit()
    
    return {"message": "Đã đổi kho active", "warehouse_id": warehouse_id}


@app.get("/warehouses/{warehouse_id}/inventory", response_model=schemas.WarehouseInventoryStats)
def get_warehouse_inventory(warehouse_id: int, db: Session = Depends(get_db)):
    warehouse = db.query(WarehouseModel).filter(WarehouseModel.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Không tìm thấy kho")
    
    warehouse_code = warehouse.code
    
    stock_in_records = db.query(StockInRecordModel).filter(
        StockInRecordModel.warehouse_code == warehouse_code
    ).all()
    stock_out_records = db.query(StockOutRecordModel).filter(
        StockOutRecordModel.warehouse_code == warehouse_code
    ).all()
    
    item_stats: Dict[str, schemas.WarehouseItemStatus] = {}
    
    for db_record in stock_in_records:
        record = stock_in_record_model_to_schema(db_record)
        for item in record.items:
            if item.item_id not in item_stats:
                item_info = db.query(ItemModel).filter(ItemModel.id == int(item.item_id)).first()
                item_stats[item.item_id] = schemas.WarehouseItemStatus(
                    item_id=item.item_id,
                    item_code=item.item_code,
                    item_name=item.item_name,
                    unit=item.unit,
                    total_in=0,
                    total_out=0,
                    current_stock=0,
                    damaged=0,
                    missing=0,
                    min_stock=item_info.min_stock if item_info else 10,
                    status="normal"
                )
            item_stats[item.item_id].total_in += item.quantity
    
    for db_record in stock_out_records:
        record = stock_out_record_model_to_schema(db_record)
        for item in record.items:
            if item.item_id not in item_stats:
                item_stats[item.item_id] = schemas.WarehouseItemStatus(
                    item_id=item.item_id,
                    item_code=item.item_code,
                    item_name=item.item_name,
                    unit=item.unit,
                    total_in=0,
                    total_out=0,
                    current_stock=0,
                    damaged=0,
                    missing=0,
                    min_stock=10,
                    status="normal"
                )
            item_stats[item.item_id].total_out += item.quantity
    
    items_list = []
    total_quantity = 0
    items_in_stock = 0
    items_low_stock = 0
    items_out_of_stock = 0
    items_damaged = 0
    items_missing = 0
    total_damaged = 0
    total_missing = 0
    
    for item_stat in item_stats.values():
        item_stat.current_stock = item_stat.total_in - item_stat.total_out
        
        if item_stat.current_stock < item_stat.min_stock:
            item_stat.missing = item_stat.min_stock - item_stat.current_stock
            total_missing += item_stat.missing
            items_missing += 1
        
        if item_stat.current_stock <= 0:
            item_stat.status = "out_of_stock"
            items_out_of_stock += 1
        elif item_stat.current_stock < item_stat.min_stock:
            item_stat.status = "low_stock"
            items_low_stock += 1
        else:
            item_stat.status = "normal"
            items_in_stock += 1
        
        total_quantity += item_stat.current_stock
        items_list.append(item_stat)
    
    return schemas.WarehouseInventoryStats(
        warehouse_id=warehouse_id,
        warehouse_code=warehouse.code,
        warehouse_name=warehouse.name,
        total_items=len(items_list),
        total_quantity=total_quantity,
        items_in_stock=items_in_stock,
        items_low_stock=items_low_stock,
        items_out_of_stock=items_out_of_stock,
        items_damaged=items_damaged,
        items_missing=items_missing,
        total_damaged=total_damaged,
        total_missing=total_missing,
        items=items_list
    )


# -------------------------------------------------
# REPORTS & ANALYTICS
# -------------------------------------------------

@app.get("/reports/inventory-by-category")
def get_inventory_by_category(db: Session = Depends(get_db)):
    items = db.query(ItemModel).all()
    category_stats: Dict[str, float] = {}
    category_colors = ["#00BCD4", "#4CAF50", "#FF9800", "#9C27B0", "#F44336", "#2196F3", "#FFC107", "#795548", "#607D8B", "#E91E63"]
    
    for item in items:
        category = item.category or "Khác"
        value = (item.quantity or 0) * item.price
        if category not in category_stats:
            category_stats[category] = 0
        category_stats[category] += value
    
    result = []
    for idx, (category, value) in enumerate(category_stats.items()):
        result.append({
            "category": category,
            "value": round(value, 2),
            "color": category_colors[idx % len(category_colors)]
        })
    return sorted(result, key=lambda x: x["value"], reverse=True)


@app.get("/reports/monthly-trend")
def get_monthly_trend_report(db: Session = Depends(get_db)):
    db_stock_in_records = db.query(StockInRecordModel).all()
    db_stock_out_records = db.query(StockOutRecordModel).all()
    
    monthly_data: Dict[str, Dict[str, int]] = {}
    
    for db_record in db_stock_in_records:
        try:
            date_obj = datetime.fromisoformat(db_record.date.replace('Z', '+00:00'))
            month_key = date_obj.strftime("%Y-%m")
            if month_key not in monthly_data:
                monthly_data[month_key] = {"import": 0, "export": 0}
            monthly_data[month_key]["import"] += db_record.total_quantity or 0
        except: pass
    
    for db_record in db_stock_out_records:
        try:
            date_obj = datetime.fromisoformat(db_record.date.replace('Z', '+00:00'))
            month_key = date_obj.strftime("%Y-%m")
            if month_key not in monthly_data:
                monthly_data[month_key] = {"import": 0, "export": 0}
            monthly_data[month_key]["export"] += db_record.total_quantity or 0
        except: pass
    
    result = []
    month_names = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"]
    
    for month_key in sorted(monthly_data.keys()):
        year, month = month_key.split("-")
        month_num = int(month)
        result.append({
            "month": f"{month_names[month_num - 1]} {year}",
            "import": monthly_data[month_key]["import"],
            "export": monthly_data[month_key]["export"]
        })
    
    return result[-12:]


@app.get("/reports/low-stock-items")
def get_low_stock_items(db: Session = Depends(get_db)):
    items = db.query(ItemModel).all()
    result = []
    for item in items:
        quantity = item.quantity or 0
        min_stock = item.min_stock or 10
        if quantity < min_stock:
            status = "danger" if quantity == 0 else "warning"
            result.append({
                "name": item.name,
                "stock": quantity,
                "min": min_stock,
                "status": status
            })
    return sorted(result, key=lambda x: (x["status"] == "danger", x["stock"]))