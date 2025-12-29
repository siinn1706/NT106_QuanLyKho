// src/app/Protected_Route.tsx
// Bảo vệ các route cần đăng nhập và kiểm tra quyền RBAC

import { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../state/auth_store';

interface ProtectedRouteProps {
  children: ReactElement;
  requiredRole?: 'admin' | 'manager' | 'staff'; // Optional role requirement
}

export default function Protected_Route({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Chưa đăng nhập -> đá về /login, nhớ vị trí cũ
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kiểm tra quyền nếu có yêu cầu
  if (requiredRole) {
    const roleHierarchy: Record<string, number> = {
      'staff': 1,
      'manager': 2,
      'admin': 3,
    };
    
    const userRole = user?.role || 'staff';
    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    if (userLevel < requiredLevel) {
      // Không đủ quyền -> đá về trang chủ hoặc hiển thị thông báo
      return <Navigate to="/" replace />;
    }
  }

  // Đã đăng nhập và có đủ quyền -> render page bên trong
  return children;
}
