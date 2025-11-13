/** App.tsx - Entry point với routing */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUIStore } from './state/ui_store';
import { useAuthStore } from './state/auth_store';

// Pages
import Login_Page from './features/auth/Login_Page';
import Register_Page from './features/auth/Register_Page';
import Layout from './components/Layout';
import Dashboard_Page from './features/dashboard/Dashboard_Page';
import Protected_Route from './app/Protected_Route';

import './styles/index.css';

export default function App() {
  const { isDarkMode } = useUIStore();
  const { isAuthenticated } = useAuthStore();

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login_Page />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register_Page />} 
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <Protected_Route>
              <Layout>
                <Dashboard_Page />
              </Layout>
            </Protected_Route>
          }
        />

        {/* Default Route */}
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
}
