/** useNotifications.ts - Notifications hook for low stock, expiry, etc. */

import { useState, useEffect } from 'react';
import { apiGetItems, Item } from '../app/api_client';

export interface Notification {
  id: string;
  type: 'low_stock' | 'expired' | 'expiring_soon' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const items = await apiGetItems();
        const newNotifications: Notification[] = [];

        items.forEach((item: Item) => {
          const quantity = item.quantity || 0;
          const minStock = item.min_stock || 10;

          // Low stock notification
          if (quantity > 0 && quantity < minStock) {
            newNotifications.push({
              id: `low_stock_${item.id}`,
              type: 'low_stock',
              title: 'Hàng sắp hết',
              message: `${item.name} (${item.sku}) chỉ còn ${quantity} ${item.unit}. Mức tối thiểu: ${minStock}`,
              timestamp: new Date(),
              read: false,
              actionUrl: '/items/alerts',
            });
          }

          // Out of stock
          if (quantity === 0) {
            newNotifications.push({
              id: `out_of_stock_${item.id}`,
              type: 'low_stock',
              title: 'Hết hàng',
              message: `${item.name} (${item.sku}) đã hết hàng`,
              timestamp: new Date(),
              read: false,
              actionUrl: '/items/alerts',
            });
          }

          // Expiry check
          if (item.expiry_date) {
            const expiryDate = new Date(item.expiry_date);
            const today = new Date();
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry < 0) {
              newNotifications.push({
                id: `expired_${item.id}`,
                type: 'expired',
                title: 'Hàng hết hạn',
                message: `${item.name} (${item.sku}) đã hết hạn`,
                timestamp: new Date(),
                read: false,
                actionUrl: '/items/alerts',
              });
            } else if (daysUntilExpiry <= 7) {
              newNotifications.push({
                id: `expiring_soon_${item.id}`,
                type: 'expiring_soon',
                title: 'Hàng sắp hết hạn',
                message: `${item.name} (${item.sku}) sẽ hết hạn sau ${daysUntilExpiry} ngày`,
                timestamp: new Date(),
                read: false,
                actionUrl: '/items/alerts',
              });
            }
          }
        });

        setNotifications(newNotifications);
        setUnreadCount(newNotifications.filter(n => !n.read).length);
      } catch (error) {
        console.error('Check notifications error:', error);
      }
    };

    // Check immediately
    checkNotifications();

    // Check every 5 minutes
    const interval = setInterval(checkNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}

