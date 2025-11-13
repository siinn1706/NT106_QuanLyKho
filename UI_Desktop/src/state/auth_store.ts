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
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,

      // gọi khi login/register thành công
      login: (user) =>
        set({
          isAuthenticated: true,
          user,
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          user: null,
        }),
    }),
    {
      name: 'n3t-auth-storage', // key lưu trong localStorage
    }
  )
);
