/** api_client.ts
 *  - Chỉ chịu trách nhiệm gọi API BE (Python + FastAPI).
 *  - KHÔNG chứa logic nghiệp vụ (tính toán tồn kho, xuất/nhập), chỉ truyền/nhận dữ liệu.
 *  - Nếu BE đã có contract (URL, body, response), phải TUÂN THỦ 100%.
 */

export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

// Types cho dữ liệu (sẽ match với response từ BE)
export interface Item {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  price: number;
  category: string;
  supplier_id?: string;
  expiry_date?: string;    // Hạn sử dụng (ISO date string: "2024-12-31")
  min_stock?: number;      // Mức tồn kho tối thiểu để cảnh báo
  description?: string;    // Mô tả sản phẩm
  created_at?: string;     // Ngày tạo
  updated_at?: string;     // Ngày cập nhật
}

export interface StockTransaction {
  id: string;
  type: 'in' | 'out';
  item_id: string;
  quantity: number;
  timestamp: string;
  note?: string;
}

export interface Supplier {
  id: string;
  name: string;
  tax_id: string;        // Mã số thuế
  address: string;
  phone: string;
  email: string;
  bank_account: string;  // Số tài khoản
  bank_name: string;     // Tên ngân hàng
  notes: string;
  outstanding_debt: number;  // Công nợ còn lại
}

// === API Hàng hoá ===
export async function apiGetItems(): Promise<Item[]> {
  const res = await fetch(`${BASE_URL}/items`);
  if (!res.ok) throw new Error("Không thể tải danh sách hàng hoá từ BE");
  return res.json();
  /* Expected JSON structure from BE (GET /items):
  [
    {
      "id": "ITEM001",
      "name": "Laptop Dell XPS 15",
      "sku": "SKU001",
      "quantity": 50,
      "unit": "cái",
      "price": 25000000,
      "category": "Điện tử",
      "supplier_id": "SUP001"
    }
  ]
  */
}

export async function apiCreateItem(item: Omit<Item, 'id'>): Promise<Item> {
  const res = await fetch(`${BASE_URL}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("Không thể thêm hàng hoá");
  return res.json();
  /* Request body (POST /items):
  {
    "name": "Laptop Dell XPS 15",
    "sku": "SKU001",
    "quantity": 50,
    "unit": "cái",
    "price": 25000000,
    "category": "Điện tử",
    "supplier_id": "SUP001"
  }
  Response: Same as Item with generated id
  */
}

export async function apiUpdateItem(id: string, item: Partial<Item>): Promise<Item> {
  const res = await fetch(`${BASE_URL}/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("Không thể cập nhật hàng hoá");
  return res.json();
  /* Request body (PUT /items/{id}):
  {
    "quantity": 60,
    "price": 26000000
  }
  Note: Can send partial fields to update
  Response: Updated Item
  */
}

export async function apiDeleteItem(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/items/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error("Không thể xoá hàng hoá");
}

// === API Nhập/Xuất kho ===
export async function apiGetStockTransactions(): Promise<StockTransaction[]> {
  const res = await fetch(`${BASE_URL}/stock/transactions`);
  if (!res.ok) throw new Error("Không thể tải lịch sử nhập/xuất");
  return res.json();
  /* Expected JSON structure from BE (GET /stock/transactions):
  [
    {
      "id": "TXN001",
      "type": "in",
      "item_id": "ITEM001",
      "quantity": 10,
      "timestamp": "2024-01-15T10:30:00",
      "note": "Nhập từ nhà cung cấp"
    }
  ]
  Note: type can be "in" or "out"
  */
}

export async function apiCreateStockTransaction(
  transaction: Omit<StockTransaction, 'id' | 'timestamp'>
): Promise<StockTransaction> {
  const res = await fetch(`${BASE_URL}/stock/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction),
  });
  if (!res.ok) throw new Error("Không thể tạo giao dịch nhập/xuất");
  return res.json();
  /* Request body (POST /stock/transactions):
  {
    "type": "in",
    "item_id": "ITEM001",
    "quantity": 10,
    "note": "Nhập từ nhà cung cấp"
  }
  Response: StockTransaction with generated id and timestamp
  */
}

// === API Nhà cung cấp ===
export async function apiGetSuppliers(): Promise<Supplier[]> {
  const res = await fetch(`${BASE_URL}/suppliers`);
  if (!res.ok) throw new Error("Không thể tải danh sách nhà cung cấp");
  return res.json();
  /* Expected JSON structure from BE (GET /suppliers):
  [
    {
      "id": "SUP001",
      "name": "Công ty ABC",
      "contact": "0901234567",
      "address": "123 Đường XYZ, TP.HCM"
    }
  ]
  */
}

export async function apiCreateSupplier(supplier: Omit<Supplier, 'id' | 'outstanding_debt'>): Promise<Supplier> {
  const res = await fetch(`${BASE_URL}/suppliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(supplier),
  });
  if (!res.ok) throw new Error("Không thể thêm nhà cung cấp");
  return res.json();
  /* Request body (POST /suppliers):
  {
    "name": "Công ty ABC",
    "tax_id": "0123456789",
    "address": "123 Đường XYZ, TP.HCM",
    "phone": "0901234567",
    "email": "contact@abc.com",
    "bank_account": "1234567890",
    "bank_name": "Vietcombank",
    "notes": "Ghi chú..."
  }
  Response: Supplier with generated id
  */
}

/**
 * API: GET /suppliers/{supplier_id}/transactions
 * Purpose: Lấy lịch sử giao dịch nhập/xuất kho của một nhà cung cấp
 * Response (JSON) [200]: {
 *   "stock_in": [...],
 *   "stock_out": [...],
 *   "total_transactions": number,
 *   "outstanding_debt": number
 * }
 * Response Errors:
 * - 404: { "detail": "Supplier not found" }
 */
export interface SupplierTransactions {
  stock_in: StockInRecord[];
  stock_out: StockOutRecord[];
  total_transactions: number;
  outstanding_debt: number;
}

export async function apiGetSupplierTransactions(supplierId: number): Promise<SupplierTransactions> {
  const res = await fetch(`${BASE_URL}/suppliers/${supplierId}/transactions`);
  if (!res.ok) throw new Error("Không thể tải lịch sử giao dịch");
  return res.json();
}

// === API Dashboard Stats ===
export interface DashboardStats {
  total_items: number;
  low_stock_count: number;
  total_value: number;
  recent_transactions: StockTransaction[];
  system_uptime?: number;
  warehouse_usage?: number;
}

export async function apiGetDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${BASE_URL}/dashboard/stats`);
  if (!res.ok) throw new Error("Không thể tải thống kê dashboard");
  return res.json();
}

// === API AI Chat (Gemini via BE) ===
export interface AIChatRequest {
  prompt: string;
  system_instruction?: string;
}

export interface AIChatResponse {
  reply: string;
  model: string;
}

export async function apiChat(req: AIChatRequest): Promise<AIChatResponse> {
  const res = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    let msg = 'Gọi AI thất bại';
    try { const e = await res.json(); msg = e.detail || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
  /* Request body (POST /ai/chat):
  {
    "prompt": "Hướng dẫn nhập kho",
    "system_instruction": "Bạn là trợ lý quản lý kho hàng"
  }
  Response:
  {
    "reply": "Để nhập kho, bạn cần...",
    "model": "gemini-1.5-flash"
  }
  */
}

// Thêm vào cuối file api_client.ts

// === API Authentication ===
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role?: string;
  };
  token?: string;
}

export async function apiLogin(credentials: LoginRequest): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Đăng nhập thất bại");
  }
  return res.json();
  /* Request body (POST /auth/login):
  {
    "email": "user@example.com",
    "password": "password123"
  }
  Response:
  {
    "user": {
      "id": "USER001",
      "email": "user@example.com",
      "name": "Nguyễn Văn A",
      "role": "admin"
    },
    "token": "jwt_token_here"
  }
  */
}

export async function apiRegister(data: RegisterRequest): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Đăng ký thất bại");
  }
  return res.json();
  /* Request body (POST /auth/register):
  {
    "email": "newuser@example.com",
    "password": "password123",
    "name": "Nguyễn Văn B"
  }
  Response: Same as login (user + token)
  Note: After registration, should trigger OTP verification
  */
}

export async function apiLogout(): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error("Đăng xuất thất bại");
}

// === API OTP Verification ===
export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export async function apiVerifyOtp(data: VerifyOtpRequest): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Xác thực OTP thất bại");
  }
  return res.json();
  /* Request body (POST /auth/verify-otp):
  {
    "email": "user@example.com",
    "otp": "123456"
  }
  Response: Same as login (user + token)
  */
}

export interface ResendOtpRequest {
  email: string;
}

export async function apiResendOtp(data: ResendOtpRequest): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Không thể gửi lại OTP");
  }
  return res.json();
  /* Request body (POST /auth/resend-otp):
  {
    "email": "user@example.com"
  }
  Response:
  {
    "message": "OTP đã được gửi lại"
  }
  */
}


// === API Stock In (Phiếu nhập kho) ===
export interface StockInItem {
  item_id: string;
  item_code: string;
  item_name: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface StockInRecord {
  id: string;
  warehouse_code: string;  // Mã kho (K1, K2,...)
  supplier: string;
  date: string;
  note: string;
  tax_rate: number;
  items: StockInItem[];
  total_quantity: number;
  total_amount: number;
  created_at: string;
  status: string;
}

export interface StockInBatchCreate {
  warehouse_code: string;  // Mã kho (K1, K2,...)
  supplier: string;
  date: string;
  note?: string;
  tax_rate?: number;
  payment_method?: 'tiền_mặt' | 'chuyển_khoản' | 'công_nợ';
  payment_bank_account?: string;
  payment_bank_name?: string;
  items: Array<{
    item_id: string;
    item_code: string;
    item_name: string;
    quantity: number;
    unit: string;
    price: number;
  }>;
}

export async function apiGetStockInRecords(): Promise<StockInRecord[]> {
  const res = await fetch(`${BASE_URL}/stock/in`);
  if (!res.ok) throw new Error("Không thể tải danh sách phiếu nhập kho");
  return res.json();
}

export async function apiGetStockInRecord(id: string): Promise<StockInRecord> {
  const res = await fetch(`${BASE_URL}/stock/in/${id}`);
  if (!res.ok) throw new Error("Không tìm thấy phiếu nhập kho");
  return res.json();
}

export async function apiCreateStockIn(data: StockInBatchCreate): Promise<StockInRecord> {
  const res = await fetch(`${BASE_URL}/stock/in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Không thể tạo phiếu nhập kho");
  }
  return res.json();
}

export async function apiDeleteStockIn(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/stock/in/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error("Không thể xóa phiếu nhập kho");
}


// === API Stock Out (Phiếu xuất kho) ===
export interface StockOutItem {
  item_id: string;
  item_code: string;
  item_name: string;
  quantity: number;
  unit: string;
  sell_price?: number;
}

export interface StockOutRecord {
  id: string;
  warehouse_code: string;  // Mã kho (K1, K2,...)
  recipient: string;
  purpose: string;
  date: string;
  note: string;
  tax_rate: number;
  items: StockOutItem[];
  total_quantity: number;
  total_amount?: number;
  created_at: string;
  status: string;
}

export interface StockOutBatchCreate {
  warehouse_code: string;  // Mã kho (K1, K2,...)
  recipient: string;
  purpose: string;
  date: string;
  note?: string;
  tax_rate?: number;
  payment_method?: 'tiền_mặt' | 'chuyển_khoản' | 'công_nợ';
  payment_bank_account?: string;
  payment_bank_name?: string;
  items: Array<{
    item_id: string;
    item_code: string;
    item_name: string;
    quantity: number;
    unit: string;
    sell_price?: number;
  }>;
}

export async function apiGetStockOutRecords(): Promise<StockOutRecord[]> {
  const res = await fetch(`${BASE_URL}/stock/out`);
  if (!res.ok) throw new Error("Không thể tải danh sách phiếu xuất kho");
  return res.json();
}

export async function apiGetStockOutRecord(id: string): Promise<StockOutRecord> {
  const res = await fetch(`${BASE_URL}/stock/out/${id}`);
  if (!res.ok) throw new Error("Không tìm thấy phiếu xuất kho");
  return res.json();
}

export async function apiCreateStockOut(data: StockOutBatchCreate): Promise<StockOutRecord> {
  const res = await fetch(`${BASE_URL}/stock/out`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Không thể tạo phiếu xuất kho");
  }
  return res.json();
}

export async function apiDeleteStockOut(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/stock/out/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error("Không thể xóa phiếu xuất kho");
}


// ========================================
// COMPANY & WAREHOUSE APIs
// ========================================

export interface CompanyInfo {
  id: number;
  name: string;
  logo: string;
  tax_id: string;
  address: string;
  phone: string;
  email: string;
  bank_name: string;
  bank_account: string;
  bank_branch: string;
}

export interface CompanyInfoUpdate {
  name?: string;
  logo?: string;
  tax_id?: string;
  address?: string;
  phone?: string;
  email?: string;
  bank_name?: string;
  bank_account?: string;
  bank_branch?: string;
}

export interface WarehouseManager {
  name: string;
  position: string;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  managers: WarehouseManager[];
  notes: string;
  created_at: string;
  is_active: boolean;
}

export interface WarehouseCreate {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  managers: WarehouseManager[];
  notes: string;
}

export interface WarehouseUpdate {
  name?: string;
  code?: string;
  address?: string;
  phone?: string;
  managers?: WarehouseManager[];
  notes?: string;
}

// Company APIs
export async function apiGetCompanyInfo(): Promise<CompanyInfo | null> {
  const res = await fetch(`${BASE_URL}/company`);
  if (!res.ok) throw new Error("Không thể tải thông tin công ty");
  const data = await res.json();
  return data || null;
}

export async function apiCreateOrUpdateCompanyInfo(data: CompanyInfoUpdate): Promise<CompanyInfo> {
  const res = await fetch(`${BASE_URL}/company`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Không thể lưu thông tin công ty");
  }
  return res.json();
}

export async function apiUpdateCompanyInfo(data: CompanyInfoUpdate): Promise<CompanyInfo> {
  const res = await fetch(`${BASE_URL}/company`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Không thể cập nhật thông tin công ty");
  }
  return res.json();
}

export interface LogoUploadResponse {
  logo_url: string;
  filename: string;
  size: number;
  dimensions: { width: number; height: number };
}

export async function apiUploadCompanyLogo(file: File): Promise<LogoUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${BASE_URL}/company/upload-logo`, {
    method: 'POST',
    body: formData,
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Không thể tải logo lên");
  }
  return res.json();
}

// Warehouse APIs
export async function apiGetWarehouses(): Promise<Warehouse[]> {
  const res = await fetch(`${BASE_URL}/warehouses`);
  if (!res.ok) throw new Error("Không thể tải danh sách kho");
  return res.json();
}

export async function apiGetActiveWarehouse(): Promise<Warehouse | null> {
  const res = await fetch(`${BASE_URL}/warehouses/active`);
  if (!res.ok) throw new Error("Không thể tải kho active");
  const data = await res.json();
  return data || null;
}

export async function apiCreateWarehouse(data: WarehouseCreate): Promise<Warehouse> {
  const res = await fetch(`${BASE_URL}/warehouses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Không thể tạo kho");
  }
  return res.json();
}

export async function apiUpdateWarehouse(id: number, data: WarehouseUpdate): Promise<Warehouse> {
  const res = await fetch(`${BASE_URL}/warehouses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Không thể cập nhật kho");
  }
  return res.json();
}

export async function apiDeleteWarehouse(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/warehouses/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error("Không thể xóa kho");
}

export async function apiSetActiveWarehouse(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/warehouses/${id}/set-active`, {
    method: 'PUT',
  });
  if (!res.ok) throw new Error("Không thể đổi kho active");
}
