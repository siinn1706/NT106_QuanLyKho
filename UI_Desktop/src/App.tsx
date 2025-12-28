/** App.tsx - Entry point với routing */

import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useUIStore } from './state/ui_store';
import { useThemeStore } from './theme/themeStore';
import { useCompanyStore } from './state/company_store';
import { useThemeSync } from './hooks/useThemeSync';
import { useAuthSync } from './hooks/useAuthSync';
import AppRoutes from './app/routes';
import { ErrorBoundary } from './components/ErrorBoundary';

import './styles/index.css';

export default function App() {
  const { isDarkMode } = useThemeStore();
  const { initialize } = useCompanyStore();

  // Sync theme preferences với server khi đăng nhập
  useThemeSync();
  
  // Sync user data với server khi app khởi động
  useAuthSync();

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Initialize company store from API
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
