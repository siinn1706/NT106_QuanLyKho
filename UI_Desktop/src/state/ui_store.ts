/** UI Store - Zustand
 *  - Quản lý state UI toàn cục: dark mode, sidebar collapse, modal states
 *  - KHÔNG chứa logic nghiệp vụ BE
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  // Dark mode
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  
  // Sidebar
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  
  // Chatbot
  isChatOpen: boolean;
  toggleChat: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Dark mode
      isDarkMode: false,
      toggleDarkMode: () => set((state) => {
        const newMode = !state.isDarkMode;
        // Cập nhật class 'dark' trên html element
        if (newMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { isDarkMode: newMode };
      }),
      
      // Sidebar
      isSidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ 
        isSidebarCollapsed: !state.isSidebarCollapsed 
      })),
      
      // Chatbot
      isChatOpen: false,
      toggleChat: () => set((state) => ({ 
        isChatOpen: !state.isChatOpen 
      })),
    }),
    {
      name: 'n3t-ui-storage', // Key trong localStorage
    }
  )
);
