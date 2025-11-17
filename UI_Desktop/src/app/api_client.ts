/** api_client.ts
 *  - Chỉ chịu trách nhiệm gọi API BE (Python + FastAPI).
 *  - KHÔNG chứa logic nghiệp vụ (tính toán tồn kho, xuất/nhập), chỉ truyền/nhận dữ liệu.
 *  - Nếu BE đã có contract (URL, body, response), phải TUÂN THỦ 100%.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

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
  contact: string;
  address: string;
}

// === API Hàng hoá ===
export async function apiGetItems(): Promise<Item[]> {
  const res = await fetch(`${BASE_URL}/items`);
  if (!res.ok) throw new Error("Không thể tải danh sách hàng hoá từ BE");
  return res.json();
}

export async function apiCreateItem(item: Omit<Item, 'id'>): Promise<Item> {
  const res = await fetch(`${BASE_URL}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("Không thể thêm hàng hoá");
  return res.json();
}

export async function apiUpdateItem(id: string, item: Partial<Item>): Promise<Item> {
  const res = await fetch(`${BASE_URL}/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("Không thể cập nhật hàng hoá");
  return res.json();
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
}

// === API Nhà cung cấp ===
export async function apiGetSuppliers(): Promise<Supplier[]> {
  const res = await fetch(`${BASE_URL}/suppliers`);
  if (!res.ok) throw new Error("Không thể tải danh sách nhà cung cấp");
  return res.json();
}

export async function apiCreateSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
  const res = await fetch(`${BASE_URL}/suppliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(supplier),
  });
  if (!res.ok) throw new Error("Không thể thêm nhà cung cấp");
  return res.json();
}

// === API Dashboard Stats ===
export interface DashboardStats {
  total_items: number;
  low_stock_count: number;
  total_value: number;
  recent_transactions: StockTransaction[];
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
  token: string;
  refresh_token?: string;
}

export async function apiLogin(credentials: LoginRequest): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || error.message || "Đăng nhập thất bại");
  }
  return res.json();
}

export async function apiRegister(data: RegisterRequest): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Backend expects `full_name`; map from UI `name`
    body: JSON.stringify({ email: data.email, password: data.password, full_name: data.name }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || error.message || "Đăng ký thất bại");
  }
  return res.json();
}

export async function apiLogout(): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error("Đăng xuất thất bại");
}
