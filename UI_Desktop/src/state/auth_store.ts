import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  role?: string;
  is_verified?: boolean;
  has_passkey?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isRemembered: boolean;
  login: (user: User, token: string, remember?: boolean) => void;
  logout: () => void;
  refreshUser: (user: User) => void;
}

// Migration helper: Convert old user data format to new format
function migrateUserData(data: any): any {
  if (data?.state?.user) {
    const oldUser = data.state.user;
    // If old format has 'name' but not 'display_name', migrate it
    if ('name' in oldUser && !('display_name' in oldUser)) {
      data.state.user = {
        ...oldUser,
        username: oldUser.username || oldUser.name,
        display_name: oldUser.name,
      };
      delete data.state.user.name;
    }
  }
  return data;
}

const customStorage: StateStorage = {
  getItem: (name) => {
    const sessionItem = sessionStorage.getItem(name);
    const rawData = sessionItem || localStorage.getItem(name);
    if (!rawData) return null;
    
    try {
      const parsed = JSON.parse(rawData);
      const migrated = migrateUserData(parsed);
      return JSON.stringify(migrated);
    } catch {
      return rawData;
    }
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

      refreshUser: (user) =>
        set((state) => ({
          ...state,
          user,
        })),
    }),
    {
      name: 'n3t-auth-storage',
      storage: createJSONStorage(() => customStorage),
      version: 1, // Increment this when schema changes
    }
  )
);