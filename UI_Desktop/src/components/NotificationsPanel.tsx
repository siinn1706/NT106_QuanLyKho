/** NotificationsPanel.tsx - Notifications panel component */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import Icon from './ui/Icon';

export default function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const navigate = useNavigate();

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const getTypeIcon = (type: typeof notifications[0]['type']) => {
    const icons = {
      low_stock: 'exclamation-triangle',
      expired: 'calendar-times',
      expiring_soon: 'calendar-alt',
      system: 'info-circle',
    };
    return icons[type];
  };

  const getTypeColor = (type: typeof notifications[0]['type']) => {
    const colors = {
      low_stock: 'text-[var(--warning)]',
      expired: 'text-[var(--danger)]',
      expiring_soon: 'text-[var(--warning)]',
      system: 'text-[var(--primary)]',
    };
    return colors[type];
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 liquid-glass-icon-btn rounded-[var(--radius-md)]"
        title="Thông báo"
      >
        <Icon name="bell" size="lg" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[var(--danger)] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Invisible backdrop for blur effect - pointer-events-none để không chặn click */}
          <div className="fixed inset-0 z-40 pointer-events-none" />

          {/* Panel với blur */}
          <div className="absolute top-full right-0 mt-2 w-96 z-[9999] max-h-[600px] liquid-glass-dropdown animate-glass-in flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]/50">
              <h3 className="font-semibold text-[var(--text-1)]">Thông báo</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-[var(--primary)] hover:underline"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-3)]">
                  <Icon name="bell-slash" size="2x" className="mx-auto mb-3 opacity-50" />
                  <p>Không có thông báo nào</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {/* Unread notifications */}
                  {unreadNotifications.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-[var(--text-3)] uppercase bg-[var(--surface-2)]">
                        Mới ({unreadNotifications.length})
                      </div>
                      {unreadNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="group relative flex items-start gap-3 px-4 py-3 hover:bg-[var(--surface-2)] transition-colors"
                        >
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="flex items-start gap-3 flex-1 min-w-0 text-left"
                          >
                            <div className={`w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0 ${getTypeColor(notification.type)}`}>
                              <Icon name={getTypeIcon(notification.type)} size="md" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[var(--text-1)] text-sm">{notification.title}</p>
                              <p className="text-xs text-[var(--text-2)] mt-1">{notification.message}</p>
                              <p className="text-xs text-[var(--text-3)] mt-1">
                                {notification.timestamp.toLocaleString('vi-VN')}
                              </p>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-[var(--primary)] flex-shrink-0 mt-2" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-[var(--danger)]/10 rounded-lg flex-shrink-0"
                            title="Xóa thông báo"
                          >
                            <Icon name="close" size="sm" className="text-[var(--danger)]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Read notifications */}
                  {readNotifications.length > 0 && (
                    <div>
                      {unreadNotifications.length > 0 && (
                        <div className="px-4 py-2 text-xs font-semibold text-[var(--text-3)] uppercase bg-[var(--surface-2)]">
                          Đã đọc
                        </div>
                      )}
                      {readNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="group relative flex items-start gap-3 px-4 py-3 hover:bg-[var(--surface-2)] transition-colors opacity-70"
                        >
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="flex items-start gap-3 flex-1 min-w-0 text-left"
                          >
                            <div className={`w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0 ${getTypeColor(notification.type)}`}>
                              <Icon name={getTypeIcon(notification.type)} size="md" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[var(--text-1)] text-sm">{notification.title}</p>
                              <p className="text-xs text-[var(--text-2)] mt-1">{notification.message}</p>
                              <p className="text-xs text-[var(--text-3)] mt-1">
                                {notification.timestamp.toLocaleString('vi-VN')}
                              </p>
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-[var(--danger)]/10 rounded-lg flex-shrink-0"
                            title="Xóa thông báo"
                          >
                            <Icon name="close" size="sm" className="text-[var(--danger)]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

