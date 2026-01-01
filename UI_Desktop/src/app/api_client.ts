/** api_client.ts
 * - Chỉ chịu trách nhiệm gọi API BE (Python + FastAPI).
 * - KHÔNG chứa logic nghiệp vụ (tính toán tồn kho, xuất/nhập), chỉ truyền/nhận dữ liệu.
 * - Nếu BE đã có contract (URL, body, response), phải TUÂN THỦ 100%.
 */

import { useAuthStore } from '../state/auth_store'; // Đã thêm: Import store

export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
console.log('[API Client] Using BASE_URL:', BASE_URL);

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  try {
    const token = useAuthStore.getState().token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      return headers;
    }
  } catch (e) {
    console.warn("Error reading token from store:", e);
  }

  try {
    const { getAuth, getIdToken } = await import('firebase/auth');
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      const token = await getIdToken(user);
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    console.debug('Firebase auth not available:', error);
  }
  
  return headers;
}

async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = await getAuthHeaders();
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });
    
    return response;
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error(`[API Error] Failed to fetch: ${url}`);
      console.error(`[API Error] BASE_URL: ${BASE_URL}`);
      console.error(`[API Error] Full URL: ${url}`);
      console.error(`[API Error] Network error - Check if:
        1. Backend server is running
        2. Backend URL is correct (${BASE_URL})
        3. CORS is configured properly
        4. Network/firewall allows connection`);
      
      throw new Error(`Không thể kết nối tới server (${BASE_URL}). Vui lòng kiểm tra:\n- Server có đang chạy?\n- URL có đúng không?\n- Có vấn đề về mạng/firewall?`);
    }
    throw error;
  }
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
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    console.error(`[API Error] GET /items failed (${res.status}):`, errorText);
    throw new Error(`Không thể tải danh sách hàng hoá (${res.status}): ${errorText}`);
  }
  return res.json();
}

export async function apiCreateItem(item: Omit<Item, 'id'>): Promise<Item> {
  const res = await apiFetch(`${BASE_URL}/items`, {
    method: 'POST',
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    console.error(`[API Error] POST /items failed (${res.status}):`, errorText);
    throw new Error(`Không thể thêm hàng hoá (${res.status}): ${errorText}`);
  }
  return res.json();
}

export async function apiUpdateItem(id: string, item: Partial<Item>): Promise<Item> {
  const res = await apiFetch(`${BASE_URL}/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    console.error(`[API Error] PUT /items/${id} failed (${res.status}):`, errorText);
    throw new Error(`Không thể cập nhật hàng hoá (${res.status}): ${errorText}`);
  }
  return res.json();
}

export async function apiDeleteItem(id: string, passkey?: string): Promise<void> {
  const headers = await getAuthHeaders();
  if (passkey) {
    (headers as Record<string, string>)['X-Passkey'] = passkey;
  }
  
  try {
    const res = await fetch(`${BASE_URL}/items/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      const errorMsg = error.detail || "Không thể xoá hàng hoá";
      console.error(`[API Error] DELETE /items/${id} failed (${res.status}):`, errorMsg);
      throw new Error(`${errorMsg} (${res.status})`);
    }
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error(`[API Error] Failed to fetch: DELETE /items/${id}`);
      throw new Error(`Không thể kết nối tới server (${BASE_URL})`);
    }
    throw error;
  }
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
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    console.error(`[API Error] GET /suppliers failed (${res.status}):`, errorText);
    throw new Error(`Không thể tải danh sách nhà cung cấp (${res.status}): ${errorText}`);
  }
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

export async function apiUpdateSupplier(id: number, supplier: Partial<Supplier>): Promise<Supplier> {
  const res = await apiFetch(`${BASE_URL}/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(supplier),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Không thể cập nhật nhà cung cấp");
  }
  return res.json();
}

export async function apiDeleteSupplier(id: number, passkey: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/suppliers/${id}`, {
    method: 'DELETE',
    headers: {
      ...headers,
      'X-Passkey': passkey,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Không thể xóa nhà cung cấp");
  }
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
  try {
    const res = await fetch(`${BASE_URL}/dashboard/stats`);
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      console.error(`[API Error] GET /dashboard/stats failed (${res.status}):`, errorText);
      throw new Error(`Không thể tải thống kê dashboard (${res.status}): ${errorText}`);
    }
    return res.json();
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error(`[API Error] Failed to fetch: GET /dashboard/stats`);
      console.error(`[API Error] BASE_URL: ${BASE_URL}`);
      throw new Error(`Không thể kết nối tới server (${BASE_URL})`);
    }
    throw error;
  }
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
    
    throw new Error(msg);
  }
  return res.json();
}

export async function apiUploadChatbotFile(file: File): Promise<{ file_id: string; url: string; name: string; size: number; mime_type: string }> {
  /**
   * API: POST /api/chatbot/files
   * Purpose: Upload file attachment for chatbot
   * Request (JSON): multipart/form-data with 'file' field
   * Response (JSON) [200]: { file_id, url, name, size, mime_type }
   * Response Errors:
   * - 400: { "detail": "Invalid file type or size" }
   * - 401: { "detail": "Unauthorized" }
   * - 413: { "detail": "File too large" }
   * - 500: { "detail": "Internal Server Error" }
   * Notes: Max 10MB, allowed exts: png/jpg/jpeg/gif/webp/pdf/doc/docx/xls/xlsx/txt/zip/rar
   */
  const headers = await getAuthHeaders();
  delete (headers as any)['Content-Type'];
  
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${BASE_URL}/api/chatbot/files`, {
    method: 'POST',
    headers,
    body: formData,
  });
  
  if (res.status === 401) {
    // Token expired - handled by global auth interceptor
    throw new Error('Session expired. Please login again.');
  }
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || 'Failed to upload file');
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

export async function apiForgotPassword(email: string): Promise<void> {
  /**
   * API: POST /auth/forgot-password
   * Purpose: Request password reset email
   * Request (JSON): { email }
   * Response (JSON) [200]: { message: "Reset email sent" }
   * Response Errors:
   * - 404: { "detail": "Email not found" }
   * - 500: { "detail": "Failed to send email" }
   */
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to send reset email");
  }
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
    const error = await res.json().catch(() => ({ detail: 'Unknown error' }));
    const errorMessage = typeof error === 'string' ? error : (error.detail || JSON.stringify(error));
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function apiDeleteStockIn(id: string, passkey: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/stock/in/${id}`, {
    method: 'DELETE',
    headers: {
      ...headers,
      'X-Passkey': passkey,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Không thể xóa phiếu nhập kho");
  }
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

export async function apiDeleteStockOut(id: string, passkey: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/stock/out/${id}`, {
    method: 'DELETE',
    headers: {
      ...headers,
      'X-Passkey': passkey,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Không thể xóa phiếu xuất kho");
  }
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
  email: string;
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


// =============================================================
// CHAT MESSAGES API
// =============================================================

export interface ReplyInfo {
  id: string;
  text: string;
  sender: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: "user" | "agent" | "bot";
  text: string;
  reply_to?: ReplyInfo | null;
  reactions: string[];
  created_at: string;
  updated_at?: string;
}

export interface ChatMessageCreate {
  id: string;
  conversation_id: string;
  sender: "user" | "agent" | "bot";
  text: string;
  reply_to?: ReplyInfo | null;
  reactions?: string[];
}

/**
 * API: GET /chat/messages/{conversation_id}
 * Purpose: Lấy tất cả tin nhắn của một conversation
 */
export async function apiGetChatMessages(conversationId: string): Promise<ChatMessage[]> {
  const res = await apiFetch(`${BASE_URL}/chat/messages/${conversationId}`);
  if (!res.ok) throw new Error("Không thể tải tin nhắn");
  return res.json();
}

/**
 * API: POST /chat/messages
 * Purpose: Tạo tin nhắn mới
 */
export async function apiCreateChatMessage(message: ChatMessageCreate): Promise<ChatMessage> {
  const res = await apiFetch(`${BASE_URL}/chat/messages`, {
    method: 'POST',
    body: JSON.stringify(message),
  });
  if (!res.ok) throw new Error("Không thể lưu tin nhắn");
  return res.json();
}

/**
 * API: PUT /chat/messages/{message_id}/reactions
 * Purpose: Cập nhật reactions của tin nhắn
 */
export async function apiUpdateMessageReactions(
  messageId: string, 
  reactions: string[]
): Promise<ChatMessage> {
  const res = await apiFetch(`${BASE_URL}/chat/messages/${messageId}/reactions`, {
    method: 'PUT',
    body: JSON.stringify({ reactions }),
  });
  if (!res.ok) throw new Error("Không thể cập nhật reactions");
  return res.json();
}

/**
 * API: DELETE /chat/messages/{conversation_id}
 * Purpose: Xóa tất cả tin nhắn của một conversation
 */
export async function apiClearChatMessages(conversationId: string): Promise<void> {
  const res = await apiFetch(`${BASE_URL}/chat/messages/${conversationId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error("Không thể xóa tin nhắn");
}


// =============================================================
// USER PREFERENCES API (Theme settings)
// =============================================================

export interface ChatThemeConfig {
  gradient_id: string;
  pattern_id: string | null;
  pattern_opacity: number;
  pattern_size_px: number;
  pattern_tint: string | null;
}

export interface UserPreferences {
  id: number;
  user_id: string;
  accent_id: string;
  light_mode_theme: ChatThemeConfig;
  dark_mode_theme: ChatThemeConfig;
  created_at: string;
  updated_at?: string;
}

export interface UserPreferencesUpdate {
  accent_id?: string;
  light_mode_theme?: ChatThemeConfig;
  dark_mode_theme?: ChatThemeConfig;
}

/**
 * API: GET /user/preferences
 * Purpose: Lấy theme preferences của user hiện tại
 */
export async function apiGetUserPreferences(): Promise<UserPreferences> {
  const res = await apiFetch(`${BASE_URL}/user/preferences`);
  if (!res.ok) throw new Error("Không thể tải user preferences");
  return res.json();
}

/**
 * API: PUT /user/preferences
 * Purpose: Cập nhật theme preferences
 */
export async function apiUpdateUserPreferences(
  data: UserPreferencesUpdate
): Promise<UserPreferences> {
  const res = await apiFetch(`${BASE_URL}/user/preferences`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Không thể cập nhật preferences");
  return res.json();
}


// =============================================================
// GLOBAL SEARCH API
// =============================================================

export interface ItemSearchResult {
  id: number;
  sku: string;
  name: string;
  unit: string;
  quantity: number;
}

export interface SupplierSearchResult {
  id: number;
  name: string;
  phone: string;
  tax_id: string;
}

export interface WarehouseSearchResult {
  id: number;
  code: string;
  name: string;
  address: string;
}

export interface StockInSearchResult {
  id: string;
  warehouse_code: string;
  supplier: string;
  date: string;
  total_quantity: number;
}

export interface StockOutSearchResult {
  id: string;
  warehouse_code: string;
  recipient: string;
  date: string;
  purpose: string;
}

export interface GlobalSearchResponse {
  items: ItemSearchResult[];
  suppliers: SupplierSearchResult[];
  warehouses?: WarehouseSearchResult[];
  stock_in: StockInSearchResult[];
  stock_out: StockOutSearchResult[];
}

/**
 * API: GET /search/global?q=&limit=
 * Purpose: Tìm kiếm toàn hệ thống
 */
export async function apiGlobalSearch(q: string, limit: number = 5): Promise<GlobalSearchResponse> {
  const res = await fetch(`${BASE_URL}/search/global?q=${encodeURIComponent(q)}&limit=${limit}`);
  if (!res.ok) {
    // Fallback to empty results if API not available
    return { items: [], suppliers: [], stock_in: [], stock_out: [] };
  }
  return res.json();
}


// =============================================================
// ITEMS ALERTS & TRACKING API
// =============================================================

export interface ItemAlert {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  category: string;
  lastUpdate: string;
  status: 'critical' | 'warning' | 'low' | 'overstock';
}

export interface TopItem {
  name: string;
  value: number;
}

export interface MonthlyTrend {
  month: string;
  value: number;
}

export interface CategoryDistribution {
  name: string;
  value: number;
  color: string;
}

/**
 * API: GET /items/alerts
 * Purpose: Lấy danh sách cảnh báo tồn kho
 */
export async function apiGetItemsAlerts(): Promise<ItemAlert[]> {
  const res = await fetch(`${BASE_URL}/items/alerts`);
  if (!res.ok) throw new Error("Không thể tải cảnh báo tồn kho");
  return res.json();
}

/**
 * API: GET /items/top-items
 */
export async function apiGetTopItems(): Promise<TopItem[]> {
  const res = await fetch(`${BASE_URL}/items/top-items`);
  if (!res.ok) return [];
  return res.json();
}

/**
 * API: GET /items/monthly-trend
 */
export async function apiGetMonthlyTrend(): Promise<MonthlyTrend[]> {
  const res = await fetch(`${BASE_URL}/items/monthly-trend`);
  if (!res.ok) return [];
  return res.json();
}

/**
 * API: GET /items/category-distribution
 */
export async function apiGetCategoryDistribution(): Promise<CategoryDistribution[]> {
  const res = await fetch(`${BASE_URL}/items/category-distribution`);
  if (!res.ok) return [];
  return res.json();
}