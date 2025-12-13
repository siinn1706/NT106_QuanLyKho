/**
 * Company & Warehouse Store - Zustand with API sync
 * - Quản lý thông tin công ty (tên, MST, địa chỉ, ngân hàng...)
 * - Quản lý danh sách kho hàng và chọn kho đang active
 * - Đồng bộ với backend API
 */

import { create } from 'zustand';
import { 
  apiGetCompanyInfo, 
  apiCreateOrUpdateCompanyInfo,
  apiGetWarehouses,
  apiGetActiveWarehouse,
  apiCreateWarehouse,
  apiUpdateWarehouse as apiUpdateWarehouseAPI,
  apiDeleteWarehouse as apiDeleteWarehouseAPI,
  apiSetActiveWarehouse,
  type CompanyInfo as APICompanyInfo,
  type Warehouse as APIWarehouse,
  type WarehouseManager,
} from '../app/api_client';

// ===== TYPES =====

export interface CompanyInfo {
  name: string;
  logo: string; // base64 hoặc URL
  taxId: string; // Mã số thuế (MST)
  address: string;
  phone: string;
  email: string;
  bankName: string;
  bankAccount: string;
  bankBranch: string;
}

export interface Warehouse {
  id: string;  // Convert from number to string for consistency
  name: string;
  code: string; // Mã kho (ví dụ: K1, K2, KHO-HCM)
  address: string;
  phone: string;
  managers: WarehouseManager[]; // Danh sách người quản lý với chức vụ
  notes: string;
  createdAt: string;
}

interface CompanyStore {
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  
  // Company Info
  companyInfo: CompanyInfo;
  updateCompanyInfo: (info: Partial<CompanyInfo>) => Promise<void>;
  setCompanyLogo: (logo: string) => Promise<void>;
  
  // Warehouses
  warehouses: Warehouse[];
  activeWarehouseId: string | null;
  loadWarehouses: () => Promise<void>;
  addWarehouse: (warehouse: Omit<Warehouse, 'id' | 'createdAt'>) => Promise<void>;
  updateWarehouse: (id: string, data: Partial<Warehouse>) => Promise<void>;
  deleteWarehouse: (id: string) => Promise<void>;
  setActiveWarehouse: (id: string) => Promise<void>;
  getActiveWarehouse: () => Warehouse | null;
  
  // Initialize from API
  initialize: () => Promise<void>;
}

// ===== HELPER FUNCTIONS =====

// Convert API CompanyInfo to local format
const convertAPICompanyInfo = (apiInfo: APICompanyInfo | null): CompanyInfo => {
  if (!apiInfo) {
    return {
      name: '',
      logo: '',
      taxId: '',
      address: '',
      phone: '',
      email: '',
      bankName: '',
      bankAccount: '',
      bankBranch: '',
    };
  }
  
  return {
    name: apiInfo.name || '',
    logo: apiInfo.logo || '',
    taxId: apiInfo.tax_id || '',
    address: apiInfo.address || '',
    phone: apiInfo.phone || '',
    email: apiInfo.email || '',
    bankName: apiInfo.bank_name || '',
    bankAccount: apiInfo.bank_account || '',
    bankBranch: apiInfo.bank_branch || '',
  };
};

// Convert local CompanyInfo to API format
const convertToAPICompanyInfo = (info: Partial<CompanyInfo>) => {
  return {
    name: info.name,
    logo: info.logo,
    tax_id: info.taxId,
    address: info.address,
    phone: info.phone,
    email: info.email,
    bank_name: info.bankName,
    bank_account: info.bankAccount,
    bank_branch: info.bankBranch,
  };
};

// Convert API Warehouse to local format
const convertAPIWarehouse = (apiWh: APIWarehouse): Warehouse => {
  return {
    id: apiWh.id.toString(),
    name: apiWh.name,
    code: apiWh.code,
    address: apiWh.address || '',
    phone: apiWh.phone || '',
    managers: apiWh.managers || [],
    notes: apiWh.notes || '',
    createdAt: apiWh.created_at,
  };
};

// ===== STORE =====

export const useCompanyStore = create<CompanyStore>((set, get) => ({
  // Loading states
  isLoading: false,
  isInitialized: false,
  
  // ----- Company Info -----
  companyInfo: {
    name: '',
    logo: '',
    taxId: '',
    address: '',
    phone: '',
    email: '',
    bankName: '',
    bankAccount: '',
    bankBranch: '',
  },
  
  updateCompanyInfo: async (info) => {
    try {
      set({ isLoading: true });
      const apiData = convertToAPICompanyInfo({ ...get().companyInfo, ...info });
      const updated = await apiCreateOrUpdateCompanyInfo(apiData);
      set({ 
        companyInfo: convertAPICompanyInfo(updated),
        isLoading: false,
      });
    } catch (error) {
      console.error('Error updating company info:', error);
      set({ isLoading: false });
      throw error;
    }
  },
  
  setCompanyLogo: async (logo) => {
    await get().updateCompanyInfo({ logo });
  },
  
  // ----- Warehouses -----
  warehouses: [],
  activeWarehouseId: null,
  
  loadWarehouses: async () => {
    try {
      set({ isLoading: true });
      const [apiWarehouses, apiActive] = await Promise.all([
        apiGetWarehouses(),
        apiGetActiveWarehouse(),
      ]);
      
      const warehouses = apiWarehouses.map(convertAPIWarehouse);
      const activeId = apiActive ? apiActive.id.toString() : null;
      
      set({ 
        warehouses,
        activeWarehouseId: activeId,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading warehouses:', error);
      set({ isLoading: false });
    }
  },
  
  addWarehouse: async (warehouseData) => {
    try {
      set({ isLoading: true });
      const created = await apiCreateWarehouse({
        name: warehouseData.name,
        code: warehouseData.code,
        address: warehouseData.address,
        phone: warehouseData.phone,
        managers: warehouseData.managers,
        notes: warehouseData.notes,
      });
      
      const newWarehouse = convertAPIWarehouse(created);
      set((state) => ({
        warehouses: [...state.warehouses, newWarehouse],
        // Nếu chưa có active, set mới làm active
        activeWarehouseId: state.activeWarehouseId || newWarehouse.id,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error adding warehouse:', error);
      set({ isLoading: false });
      throw error;
    }
  },
  
  updateWarehouse: async (id, data) => {
    try {
      set({ isLoading: true });
      const updated = await apiUpdateWarehouseAPI(parseInt(id), {
        name: data.name,
        code: data.code,
        address: data.address,
        phone: data.phone,
        managers: data.managers,
        notes: data.notes,
      });
      
      const updatedWarehouse = convertAPIWarehouse(updated);
      set((state) => ({
        warehouses: state.warehouses.map((wh) =>
          wh.id === id ? updatedWarehouse : wh
        ),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error updating warehouse:', error);
      set({ isLoading: false });
      throw error;
    }
  },
  
  deleteWarehouse: async (id) => {
    try {
      set({ isLoading: true });
      await apiDeleteWarehouseAPI(parseInt(id));
      
      set((state) => {
        const newWarehouses = state.warehouses.filter((wh) => wh.id !== id);
        // Nếu xóa warehouse đang active, chuyển sang warehouse đầu tiên
        let newActiveId = state.activeWarehouseId;
        if (state.activeWarehouseId === id) {
          newActiveId = newWarehouses.length > 0 ? newWarehouses[0].id : null;
        }
        
        return {
          warehouses: newWarehouses,
          activeWarehouseId: newActiveId,
          isLoading: false,
        };
      });
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      set({ isLoading: false });
      throw error;
    }
  },
  
  setActiveWarehouse: async (id) => {
    try {
      set({ isLoading: true });
      await apiSetActiveWarehouse(parseInt(id));
      set({ 
        activeWarehouseId: id,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error setting active warehouse:', error);
      set({ isLoading: false });
      throw error;
    }
  },
  
  getActiveWarehouse: () => {
    const state = get();
    return state.warehouses.find((wh) => wh.id === state.activeWarehouseId) || null;
  },
  
  // ----- Initialize -----
  initialize: async () => {
    if (get().isInitialized) return;
    
    try {
      set({ isLoading: true });
      
      // Load company info and warehouses in parallel
      const [apiCompanyInfo] = await Promise.all([
        apiGetCompanyInfo(),
        get().loadWarehouses(),
      ]);
      
      set({
        companyInfo: convertAPICompanyInfo(apiCompanyInfo),
        isInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error initializing company store:', error);
      set({ 
        isInitialized: true,  // Mark as initialized even on error
        isLoading: false,
      });
    }
  },
}));
