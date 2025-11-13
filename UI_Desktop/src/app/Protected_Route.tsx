// src/app/Protected_Route.tsx
// Bảo vệ các route cần đăng nhập

import { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../state/auth_store';

interface ProtectedRouteProps {
  children: ReactElement;
}

export default function Protected_Route({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Chưa đăng nhập -> đá về /login, nhớ vị trí cũ
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Đã đăng nhập -> render page bên trong
  return children;
}
