// src/app/routes.tsx
// Định nghĩa toàn bộ route của app

import { Routes, Route, Navigate } from 'react-router-dom';

import Layout from '../components/Layout';

// Auth pages (UI giữ nguyên của bạn)
import Login_Page from '../features/auth/Login_Page';
import Register_Page from '../features/auth/Register_Page';

// Main pages
import Dashboard_Page from '../features/dashboard/Dashboard_Page';
// Nếu sau này bạn có thêm:
import Items_List_Page from '../features/items/Items_List_Page';
import Items_Tracking_Page from '../features/items/Items_Tracking_Page';
import Stock_InOut_Page from '../features/stock/Stock_InOut_Page';
import Suppliers_Page from '../features/suppliers/Suppliers_Page';
import Reports_Page from '../features/reports/Reports_Page';

import Protected_Route from './Protected_Route';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<Login_Page />} />
      <Route path="/register" element={<Register_Page />} />

      {/* Default: chuyển / -> /dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Dashboard */}
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

      {/* Hàng hoá */}
      <Route
        path="/items"
        element={
          <Protected_Route>
            <Layout>
              <Items_List_Page />
            </Layout>
          </Protected_Route>
        }
      />
      
      <Route
        path="/items/tracking"
        element={
          <Protected_Route>
            <Layout>
              <Items_Tracking_Page />
            </Layout>
          </Protected_Route>
        }
      />

      {/* Nhập / Xuất kho */}
      <Route
        path="/stock"
        element={
          <Protected_Route>
            <Layout>
              <Stock_InOut_Page />
            </Layout>
          </Protected_Route>
        }
      />

      {/* Nhà cung cấp */}
      <Route
        path="/suppliers"
        element={
          <Protected_Route>
            <Layout>
              <Suppliers_Page />
            </Layout>
          </Protected_Route>
        }
      />

      {/* Báo cáo */}
      <Route
        path="/reports"
        element={
          <Protected_Route>
            <Layout>
              <Reports_Page />
            </Layout>
          </Protected_Route>
        }
      />

      {/* Route lạ -> về dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
