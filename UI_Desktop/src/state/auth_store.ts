import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  fullName?: string;
  avatar?: string;
  role?: string;
  is_verified?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isRemembered: boolean;
  login: (user: User, token: string, remember?: boolean) => void;
  logout: () => void;
}

const customStorage: StateStorage = {
  getItem: (name) => {
    const sessionItem = sessionStorage.getItem(name);
    if (sessionItem) return sessionItem;
    return localStorage.getItem(name);
  },
  setItem: (name, value) => {
    try {
      const parsed = JSON.parse(value);
      const isRemembered = parsed.state?.isRemembered;

      if (isRemembered) {
        localStorage.setItem(name, value);
        sessionStorage.removeItem(name);
      } else {
        sessionStorage.setItem(name, value);
        localStorage.removeItem(name);
      }
    } catch (e) {
      localStorage.setItem(name, value);
    }
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      isRemembered: false,

      login: (user, token, remember = false) =>
        set({
          isAuthenticated: true,
          user,
          token,
          isRemembered: remember,
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          isRemembered: false,
        }),
    }),
    {
      name: 'n3t-auth-storage',
      storage: createJSONStorage(() => customStorage),
    }
  )
);