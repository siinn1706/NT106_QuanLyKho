/**
 * useNavigationTracking.ts - Track page navigation để update lastSeen cho notifications
 * 
 * Auto update lastSeen khi user navigate vào các routes chính
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNotificationsStore } from '../state/notifications_store';
import { NotificationModule } from '../types/notification';

/**
 * Map route patterns to notification modules
 */
const routeModuleMap: Record<string, NotificationModule> = {
  '/dashboard': 'home',
  '/items': 'items',
  '/items/tracking': 'items',
  '/items/alerts': 'items',
  '/stock': 'stock',
  '/stock/in': 'stock',
  '/stock/out': 'stock',
  '/suppliers': 'suppliers',
  '/warehouses': 'warehouses',
  '/reports': 'reports',
};

/**
 * Hook tự động update lastSeen khi navigate
 * 
 * Event notifications được tạo sau lastSeen sẽ hiển thị badge
 * Khi user vào page → update lastSeen → event cũ không còn badge nữa
 */
export function useNavigationTracking() {
  const location = useLocation();
  const setLastSeen = useNotificationsStore((state) => state.setLastSeen);
  
  useEffect(() => {
    const module = routeModuleMap[location.pathname];
    
    if (module) {
      setLastSeen(module);
    }
  }, [location.pathname, setLastSeen]);
}

export default useNavigationTracking;
