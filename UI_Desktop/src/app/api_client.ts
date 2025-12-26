/** api_client.ts
 * - Chỉ chịu trách nhiệm gọi API BE (Python + FastAPI).
 * - KHÔNG chứa logic nghiệp vụ (tính toán tồn kho, xuất/nhập), chỉ truyền/nhận dữ liệu.
 * - Nếu BE đã có contract (URL, body, response), phải TUÂN THỦ 100%.
 */

import { useAuthStore } from '../state/auth_store'; // Đã thêm: Import store

export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

// Helper to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // CÁCH 1: Lấy token từ Auth Store (Ưu tiên số 1 - Sửa cho app của bạn)
  try {
    const token = useAuthStore.getState().token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      return headers; // Đã có token, trả về luôn
    }
  } catch (e) {
    console.warn("Lỗi đọc token từ store:", e);
  }

  // CÁCH 2: Fallback sang Firebase SDK (Giữ lại để tương thích cũ nếu cần)
  try {
    // @ts-ignore - Firebase might not be initialized yet
    const { getAuth, getIdToken } = await import('firebase/auth');
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      const token = await getIdToken(user);
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    // Firebase not available or not initialized - continue without token
    console.debug('Firebase auth not available:', error);
  }
  
  return headers;
}

// Helper to make authenticated API calls
async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = await getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });
}

// Types cho dữ liệu (sẽ match với response từ BE)
export interface Item {
  id: number;  
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  price: number;
  category: string;
  supplier_id?: number;  
  expiry_date?: string;    
  min_stock?: number;      
  description?: string;    
  created_at?: string;     
  updated_at?: string;     
}

export interface StockTransaction {
  id: number;  
  type: 'in' | 'out';
  item_id: number;  
  quantity: number;
  timestamp: string;
  note?: string;
}

export interface Supplier {
  id: string;
  name: string;
  tax_id: string;        
  address: string;
  phone: string;
  email: string;
  bank_account: string;  
  bank_name: string;     
  notes: string;
  outstanding_debt: number;  
}

// === API Hàng hoá ===
export async function apiGetItems(): Promise<Item[]> {
  const res = await apiFetch(`${BASE_URL}/items`);
  if (!res.ok) throw new Error("Không thể tải danh sách hàng hoá từ BE");
  return res.json();
}

export async function apiCreateItem(item: Omit<Item, 'id'>): Promise<Item> {
  const res = await apiFetch(`${BASE_URL}/items`, {
    method: 'POST',
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("Không thể thêm hàng hoá");
  return res.json();
}

export async function apiUpdateItem(id: string, item: Partial<Item>): Promise<Item> {
  const res = await apiFetch(`${BASE_URL}/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("Không thể cập nhật hàng hoá");
  return res.json();
}

export async function apiDeleteItem(id: string): Promise<void> {
  const res = await apiFetch(`${BASE_URL}/items/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error("Không thể xoá hàng hoá");
}

// === API Nhập/Xuất kho ===
export async function apiGetStockTransactions(): Promise<StockTransaction[]> {
  const res = await apiFetch(`${BASE_URL}/stock/transactions`);
  if (!res.ok) throw new Error("Không thể tải lịch sử nhập/xuất");
  return res.json();
}

export async function apiCreateStockTransaction(
  transaction: Omit<StockTransaction, 'id' | 'timestamp'>
): Promise<StockTransaction> {
  const res = await apiFetch(`${BASE_URL}/stock/transactions`, {
    method: 'POST',
    body: JSON.stringify(transaction),
  });
  if (!res.ok) throw new Error("Không thể tạo giao dịch nhập/xuất");
  return res.json();
}

// === API Nhà cung cấp ===
export async function apiGetSuppliers(): Promise<Supplier[]> {
  const res = await apiFetch(`${BASE_URL}/suppliers`);
  if (!res.ok) throw new Error("Không thể tải danh sách nhà cung cấp");
  return res.json();
}

export async function apiCreateSupplier(supplier: Omit<Supplier, 'id' | 'outstanding_debt'>): Promise<Supplier> {
  const res = await apiFetch(`${BASE_URL}/suppliers`, {
    method: 'POST',
    body: JSON.stringify(supplier),
  });
  if (!res.ok) throw new Error("Không thể thêm nhà cung cấp");
  return res.json();
}

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
    let retryAfter: number | null = null;
    
    try { 
      const e = await res.json(); 
      msg = e.detail || msg;
      
      if (res.status === 429) {
        retryAfter = res.headers.get('Retry-After') 
          ? parseInt(res.headers.get('Retry-After') || '0', 10) 
          : null;
        
        const minutes = retryAfter ? Math.ceil(retryAfter / 60) : null;
        if (minutes && minutes > 0) {
          msg = `⚠️ Đã vượt quá giới hạn sử dụng API Gemini.\n\nVui lòng thử lại sau ${minutes} phút.\n\nBạn có thể:\n• Chờ đợi và thử lại sau\n• Nâng cấp gói API Gemini để tăng quota\n• Liên hệ admin để được hỗ trợ`;
        } else {
          msg = `⚠️ Đã vượt quá giới hạn sử dụng API Gemini.\n\nVui lòng thử lại sau một lúc.\n\nBạn có thể:\n• Chờ đợi và thử lại sau\n• Nâng cấp gói API Gemini để tăng quota\n• Liên hệ admin để được hỗ trợ`;
        }
      }
    } catch {}
    
    const error = new Error(msg);
    (error as any).status = res.status;
    (error as any).retryAfter = retryAfter;
    throw error;
  }
  return res.json();
}

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
  warehouse_code: string;  
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
  warehouse_code: string;  
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
  const res = await apiFetch(`${BASE_URL}/stock/in`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Không thể tạo phiếu nhập kho");
  }
  return res.json();
}

export async function apiDeleteStockIn(id: string): Promise<void> {
  const res = await apiFetch(`${BASE_URL}/stock/in/${id}`, {
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
  warehouse_code: string;  
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
  warehouse_code: string;  
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
  const res = await apiFetch(`${BASE_URL}/stock/out`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Không thể tạo phiếu xuất kho");
  }
  return res.json();
}

export async function apiDeleteStockOut(id: string): Promise<void> {
  const res = await apiFetch(`${BASE_URL}/stock/out/${id}`, {
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
  const res = await apiFetch(`${BASE_URL}/company`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Không thể lưu thông tin công ty");
  }
  return res.json();
}

export async function apiUpdateCompanyInfo(data: CompanyInfoUpdate): Promise<CompanyInfo> {
  const res = await apiFetch(`${BASE_URL}/company`, {
    method: 'PUT',
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
  const res = await apiFetch(`${BASE_URL}/warehouses`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Không thể tạo kho");
  }
  return res.json();
}

export async function apiUpdateWarehouse(id: number, data: WarehouseUpdate): Promise<Warehouse> {
  const res = await apiFetch(`${BASE_URL}/warehouses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Không thể cập nhật kho");
  }
  return res.json();
}

export async function apiDeleteWarehouse(id: number): Promise<void> {
  const res = await apiFetch(`${BASE_URL}/warehouses/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error("Không thể xóa kho");
}

export async function apiSetActiveWarehouse(id: number): Promise<void> {
  const res = await apiFetch(`${BASE_URL}/warehouses/${id}/set-active`, {
    method: 'PUT',
  });
  if (!res.ok) throw new Error("Không thể đổi kho active");
}

// === API Warehouse Inventory Statistics ===
export interface WarehouseItemStatus {
  item_id: string;
  item_code: string;
  item_name: string;
  unit: string;
  total_in: number;
  total_out: number;
  current_stock: number;
  damaged: number;
  missing: number;
  min_stock: number;
  status: 'normal' | 'low_stock' | 'out_of_stock' | 'damaged';
}

export interface WarehouseInventoryStats {
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
  total_items: number;
  total_quantity: number;
  items_in_stock: number;
  items_low_stock: number;
  items_out_of_stock: number;
  items_damaged: number;
  items_missing: number;
  total_damaged: number;
  total_missing: number;
  items: WarehouseItemStatus[];
}

export async function apiGetWarehouseInventory(warehouseId: number): Promise<WarehouseInventoryStats> {
  const res = await fetch(`${BASE_URL}/warehouses/${warehouseId}/inventory`);
  if (!res.ok) throw new Error("Không thể tải thống kê hàng hóa trong kho");
  return res.json();
}