/**
 * useNotificationBadges.ts - Simple hook for badge counts
 * 
 * Returns badge counts cho từng module để dùng trong Layout sidebar
 */

import { useNotificationsStore } from '../state/notifications_store';

export interface NotificationBadges {
  home: number;
  items: number;
  stock: number;
  suppliers: number;
  warehouses: number;
  reports: number;
  // Sub-counts
  stockIn: number;
  stockOut: number;
  itemsAlerts: number;
}

/**
 * Hook đơn giản return badge counts từ store
 * Không tạo polling riêng, chỉ subscribe vào store
 */
export function useNotificationBadges(): NotificationBadges {
  const counts = useNotificationsStore((state) => state.counts);
  
  return counts;
}

/**
 * Hook để get full notifications list (cho NotificationsPanel)
 */
export function useNotifications() {
  const notifications = useNotificationsStore((state) => state.notifications);
  const markRead = useNotificationsStore((state) => state.markRead);
  const markAllRead = useNotificationsStore((state) => state.markAllRead);
  const dismiss = useNotificationsStore((state) => state.dismiss);
  const deleteNotification = useNotificationsStore((state) => state.deleteNotification);
  const setLastSeen = useNotificationsStore((state) => state.setLastSeen);
  const refresh = useNotificationsStore((state) => state.refresh);
  const isLoading = useNotificationsStore((state) => state.isLoading);
  
  // Separate unread and read
  const unreadNotifications = notifications.filter(n => !n.readAt);
  const readNotifications = notifications.filter(n => n.readAt);
  const unreadCount = unreadNotifications.length;
  
  return {
    notifications,
    unreadNotifications,
    readNotifications,
    unreadCount,
    markRead,
    markAllRead,
    dismiss,
    deleteNotification,
    setLastSeen,
    refresh,
    isLoading,
  };
}
