/** NotificationsPanel.tsx - Notifications panel component */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotificationBadges';
import Icon from './ui/Icon';
import { Notification } from '../types/notification';

export default function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadNotifications,
    readNotifications,
    unreadCount,
    markRead,
    markAllRead,
  } = useNotifications();
  const navigate = useNavigate();

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

  const handleNotificationClick = (notification: Notification) => {
    markRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const getTypeIcon = (type: Notification['type']) => {
    const iconMap: Record<string, string> = {
      low_stock: 'exclamation-triangle',
      out_of_stock: 'times-circle',
      expired: 'calendar-times',
      expiring_soon: 'calendar-alt',
      negative_stock: 'exclamation-circle',
      invalid_item: 'exclamation-triangle',
      stock_in_created: 'arrow-down',
      stock_out_created: 'arrow-up',
      stock_in_cancelled: 'times',
      stock_out_cancelled: 'times',
      stock_record_invalid: 'exclamation-triangle',
      supplier_missing_contact: 'phone-slash',
      supplier_outstanding_debt: 'money-bill-wave',
      supplier_missing_tax_id: 'file-invoice',
      supplier_duplicate: 'clone',
      supplier_created: 'plus-circle',
      supplier_updated: 'edit',
      warehouse_inactive_selected: 'exclamation-triangle',
      warehouse_missing_manager: 'user-slash',
      warehouse_invalid: 'exclamation-triangle',
      warehouse_created: 'plus-circle',
      warehouse_updated: 'edit',
      report_export_failed: 'times-circle',
      report_data_mismatch: 'exclamation-triangle',
      report_ready: 'check-circle',
      system_error: 'times-circle',
      system_info: 'info-circle',
      system_maintenance: 'tools',
    };
    return iconMap[type] || 'info-circle';
  };

  const getTypeColor = (severity: Notification['severity']) => {
    const colorMap: Record<string, string> = {
      info: 'text-[var(--primary)]',
      warning: 'text-[var(--warning)]',
      critical: 'text-[var(--danger)]',
    };
    return colorMap[severity] || 'text-[var(--primary)]';
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
            {unreadCount > 99 ? '99+' : unreadCount}
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
                  onClick={() => markAllRead()}
                  className="text-sm text-[var(--primary)] hover:underline"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {unreadNotifications.length === 0 && readNotifications.length === 0 ? (
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
                          onClick={() => handleNotificationClick(notification)}
                          className="w-full px-4 py-3 text-left hover:bg-[var(--surface-2)] transition-colors flex items-start gap-3"
                        >
                          <div className={`w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0 ${getTypeColor(notification.severity)}`}>
                            <Icon name={getTypeIcon(notification.type)} size="md" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[var(--text-1)] text-sm">{notification.title}</p>
                            <p className="text-xs text-[var(--text-2)] mt-1">{notification.message}</p>
                            <p className="text-xs text-[var(--text-3)] mt-1">
                              {new Date(notification.createdAt).toLocaleString('vi-VN')}
                            </p>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-[var(--primary)] flex-shrink-0 mt-2" />
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
                          onClick={() => handleNotificationClick(notification)}
                          className="w-full px-4 py-3 text-left hover:bg-[var(--surface-2)] transition-colors flex items-start gap-3 opacity-70"
                        >
                          <div className={`w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0 ${getTypeColor(notification.severity)}`}>
                            <Icon name={getTypeIcon(notification.type)} size="md" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[var(--text-1)] text-sm">{notification.title}</p>
                            <p className="text-xs text-[var(--text-2)] mt-1">{notification.message}</p>
                            <p className="text-xs text-[var(--text-3)] mt-1">
                              {new Date(notification.createdAt).toLocaleString('vi-VN')}
                            </p>
                          </div>
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
