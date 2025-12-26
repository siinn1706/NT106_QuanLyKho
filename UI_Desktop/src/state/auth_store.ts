// src/state/auth_store.ts
// Quản lý trạng thái đăng nhập (Auth) bằng Zustand

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null; // Đã thêm: biến lưu token
  login: (user: User, token: string) => void; // Đã sửa: nhận thêm token
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null, // Mặc định null

      // Gọi khi login/register thành công
      login: (user, token) =>
        set({
          isAuthenticated: true,
          user,
          token, // Lưu token vào store
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          user: null,
          token: null, // Xóa token khi đăng xuất
        }),
    }),
    {
      name: 'n3t-auth-storage', // key lưu trong localStorage
    }
  )
);