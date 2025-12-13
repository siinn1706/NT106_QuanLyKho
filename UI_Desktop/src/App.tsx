/** App.tsx - Entry point với routing */

import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useUIStore } from './state/ui_store';
import { useCompanyStore } from './state/company_store';
import AppRoutes from './app/routes';

import './styles/index.css';

export default function App() {
  const { isDarkMode } = useUIStore();
  const { initialize } = useCompanyStore();

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
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
