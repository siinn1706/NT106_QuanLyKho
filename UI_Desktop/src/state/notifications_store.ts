/**
 * notifications_store.ts - Zustand store for notifications
 * 
 * Single source of truth cho notifications và badge counts
 * Tích hợp persistence localStorage theo userId
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './auth_store';
import { 
  Notification, 
  NotificationCounts, 
  NotificationConfig,
  NotificationPersistence,
  NotificationModule,
} from '../types/notification';

// ==================== DEFAULT CONFIG ====================
const DEFAULT_CONFIG: NotificationConfig = {
  expiringDays: 7,
  lowStockThreshold: 10,
  outstandingDebtThreshold: 100_000_000,
  pollInterval: 120_000, // 2 minutes
  cacheTTL: 60_000,      // 1 minute
};

// ==================== STORE STATE ====================
interface NotificationsState {
  // Core data
  notifications: Notification[];
  counts: NotificationCounts;
  config: NotificationConfig;
  
  // Persistence (per user)
  readMap: Record<string, string>;
  lastSeenMap: Record<string, string>;
  dismissedUntilMap: Record<string, string>;
  
  // Loading states
  isLoading: boolean;
  lastRefresh: string | null;
  error: string | null;
  
  // Poll control
  pollIntervalId: ReturnType<typeof setInterval> | null;
  
  // Actions
  setNotifications: (notifications: Notification[]) => void;
  refresh: () => Promise<void>;
  markRead: (id: string) => void;
  markAllRead: (module?: NotificationModule) => void;
  dismiss: (id: string, until?: string) => void;
  deleteNotification: (id: string) => void;
  setLastSeen: (module: NotificationModule, timestamp?: string) => void;
  updateConfig: (config: Partial<NotificationConfig>) => void;
  startPolling: () => void;
  stopPolling: () => void;
  clearForUser: () => void;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Tính badge counts từ danh sách notifications
 */
function computeCounts(
  notifications: Notification[],
  readMap: Record<string, string>,
  dismissedUntilMap: Record<string, string>
): NotificationCounts {
  const now = new Date().toISOString();
  
  const active = notifications.filter(n => {
    // Unread
    if (readMap[n.id]) return false;
    
    // Not dismissed or dismissed period expired
    const dismissedUntil = dismissedUntilMap[n.id];
    if (dismissedUntil && dismissedUntil > now) return false;
    
    return true;
  });
  
  const items = active.filter(n => n.module === 'items').length;
  const stock = active.filter(n => n.module === 'stock').length;
  const suppliers = active.filter(n => n.module === 'suppliers').length;
  const warehouses = active.filter(n => n.module === 'warehouses').length;
  const reports = active.filter(n => n.module === 'reports').length;
  
  // Sub-counts
  const stockIn = active.filter(n => 
    n.module === 'stock' && (n.type === 'stock_in_created' || n.type === 'stock_in_cancelled')
  ).length;
  
  const stockOut = active.filter(n => 
    n.module === 'stock' && (n.type === 'stock_out_created' || n.type === 'stock_out_cancelled')
  ).length;
  
  const itemsAlerts = active.filter(n => 
    n.module === 'items' && ['low_stock', 'out_of_stock', 'expired', 'expiring_soon'].includes(n.type)
  ).length;
  
  // Home = tổng tất cả (trừ system nếu muốn)
  const home = active.filter(n => n.module !== 'system').length;
  
  return {
    home,
    items,
    stock,
    suppliers,
    warehouses,
    reports,
    stockIn,
    stockOut,
    itemsAlerts,
  };
}

/**
 * Merge notifications cũ với mới, giữ read state
 */
function mergeNotifications(
  prev: Notification[],
  next: Notification[],
  readMap: Record<string, string>,
  dismissedUntilMap: Record<string, string>
): Notification[] {
  const merged: Notification[] = [];
  const seen = new Set<string>();
  
  // Add/update from next
  for (const n of next) {
    seen.add(n.id);
    
    // Preserve read state
    if (readMap[n.id]) {
      merged.push({ ...n, readAt: readMap[n.id] });
    } else {
      merged.push({ ...n, readAt: null });
    }
    
    // Preserve dismissed state
    if (dismissedUntilMap[n.id]) {
      merged[merged.length - 1].dismissedUntil = dismissedUntilMap[n.id];
    }
  }
  
  // Keep old event notifications that are still unread
  for (const old of prev) {
    if (seen.has(old.id)) continue;
    
    // Only keep event notifications that are unread
    if (old.kind === 'event' && !readMap[old.id]) {
      merged.push(old);
    }
  }
  
  // Sort by createdAt desc
  merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return merged;
}

/**
 * Cleanup expired read/dismiss entries để tránh phình
 */
function cleanupExpiredEntries(
  notifications: Notification[],
  readMap: Record<string, string>,
  dismissedUntilMap: Record<string, string>
): { readMap: Record<string, string>; dismissedUntilMap: Record<string, string> } {
  const now = new Date().toISOString();
  const activeIds = new Set(notifications.map(n => n.id));
  
  // Keep only active notification entries
  const cleanReadMap: Record<string, string> = {};
  const cleanDismissedMap: Record<string, string> = {};
  
  for (const id of activeIds) {
    if (readMap[id]) {
      cleanReadMap[id] = readMap[id];
    }
    if (dismissedUntilMap[id] && dismissedUntilMap[id] > now) {
      cleanDismissedMap[id] = dismissedUntilMap[id];
    }
  }
  
  return { readMap: cleanReadMap, dismissedUntilMap: cleanDismissedMap };
}

// ==================== STORE ====================
export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      counts: {
        home: 0,
        items: 0,
        stock: 0,
        suppliers: 0,
        warehouses: 0,
        reports: 0,
        stockIn: 0,
        stockOut: 0,
        itemsAlerts: 0,
      },
      config: DEFAULT_CONFIG,
      readMap: {},
      lastSeenMap: {},
      dismissedUntilMap: {},
      isLoading: false,
      lastRefresh: null,
      error: null,
      pollIntervalId: null,
      
      // Actions
      setNotifications: (notifications: Notification[]) => {
        const { readMap, dismissedUntilMap } = get();
        
        // Merge with existing
        const merged = mergeNotifications(get().notifications, notifications, readMap, dismissedUntilMap);
        
        // Cleanup expired entries
        const cleaned = cleanupExpiredEntries(merged, readMap, dismissedUntilMap);
        
        // Compute counts
        const counts = computeCounts(merged, cleaned.readMap, cleaned.dismissedUntilMap);
        
        set({
          notifications: merged,
          counts,
          readMap: cleaned.readMap,
          dismissedUntilMap: cleaned.dismissedUntilMap,
          lastRefresh: new Date().toISOString(),
        });
      },
      
      refresh: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Import notification engine dynamically để tránh circular dependency
          const { buildAllNotifications } = await import('../services/notification_engine');
          
          const notifications = await buildAllNotifications(get().config);
          get().setNotifications(notifications);
        } catch (error) {
          console.error('[NotificationsStore] Refresh error:', error);
          set({ error: error instanceof Error ? error.message : 'Unknown error' });
        } finally {
          set({ isLoading: false });
        }
      },
      
      markRead: (id: string) => {
        const now = new Date().toISOString();
        const { readMap, dismissedUntilMap } = get();
        
        const newReadMap = { ...readMap, [id]: now };
        const counts = computeCounts(get().notifications, newReadMap, dismissedUntilMap);
        
        set({
          readMap: newReadMap,
          counts,
          notifications: get().notifications.map(n => 
            n.id === id ? { ...n, readAt: now } : n
          ),
        });
      },
      
      markAllRead: (module?: NotificationModule) => {
        const now = new Date().toISOString();
        const { readMap, dismissedUntilMap } = get();
        
        const newReadMap = { ...readMap };
        
        get().notifications.forEach(n => {
          if (!module || n.module === module) {
            newReadMap[n.id] = now;
          }
        });
        
        const counts = computeCounts(get().notifications, newReadMap, dismissedUntilMap);
        
        set({
          readMap: newReadMap,
          counts,
          notifications: get().notifications.map(n => 
            !module || n.module === module ? { ...n, readAt: now } : n
          ),
        });
      },
      
      dismiss: (id: string, until?: string) => {
        const dismissUntil = until || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h default
        const { readMap, dismissedUntilMap } = get();
        
        const newDismissedMap = { ...dismissedUntilMap, [id]: dismissUntil };
        const counts = computeCounts(get().notifications, readMap, newDismissedMap);
        
        set({
          dismissedUntilMap: newDismissedMap,
          counts,
          notifications: get().notifications.map(n => 
            n.id === id ? { ...n, dismissedUntil: dismissUntil } : n
          ),
        });
      },
      
      deleteNotification: (id: string) => {
        const { readMap, dismissedUntilMap } = get();
        
        // Remove notification from list
        const filteredNotifications = get().notifications.filter(n => n.id !== id);
        
        // Remove from read/dismiss maps
        const newReadMap = { ...readMap };
        const newDismissedMap = { ...dismissedUntilMap };
        delete newReadMap[id];
        delete newDismissedMap[id];
        
        // Recompute counts
        const counts = computeCounts(filteredNotifications, newReadMap, newDismissedMap);
        
        set({
          notifications: filteredNotifications,
          readMap: newReadMap,
          dismissedUntilMap: newDismissedMap,
          counts,
        });
      },
      
      setLastSeen: (module: NotificationModule, timestamp?: string) => {
        const ts = timestamp || new Date().toISOString();
        set({
          lastSeenMap: { ...get().lastSeenMap, [module]: ts },
        });
      },
      
      updateConfig: (config: Partial<NotificationConfig>) => {
        set({ config: { ...get().config, ...config } });
      },
      
      startPolling: () => {
        const state = get();
        
        // Stop existing poll
        if (state.pollIntervalId) {
          clearInterval(state.pollIntervalId);
        }
        
        // Initial refresh
        state.refresh();
        
        // Start new poll
        const intervalId = setInterval(() => {
          state.refresh();
        }, state.config.pollInterval);
        
        set({ pollIntervalId: intervalId });
      },
      
      stopPolling: () => {
        const { pollIntervalId } = get();
        if (pollIntervalId) {
          clearInterval(pollIntervalId);
          set({ pollIntervalId: null });
        }
      },
      
      clearForUser: () => {
        get().stopPolling();
        set({
          notifications: [],
          counts: {
            home: 0,
            items: 0,
            stock: 0,
            suppliers: 0,
            warehouses: 0,
            reports: 0,
            stockIn: 0,
            stockOut: 0,
            itemsAlerts: 0,
          },
          readMap: {},
          lastSeenMap: {},
          dismissedUntilMap: {},
          lastRefresh: null,
          error: null,
        });
      },
    }),
    {
      name: 'notifications-storage',
      // Partialize: chỉ persist những gì cần thiết theo user
      partialize: (state) => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) return {};
        
        return {
          readMap: state.readMap,
          lastSeenMap: state.lastSeenMap,
          dismissedUntilMap: state.dismissedUntilMap,
          config: state.config,
        };
      },
    }
  )
);

// ==================== INIT ON AUTH ====================
// Auto start/stop polling khi user login/logout
useAuthStore.subscribe((state) => {
  const notifStore = useNotificationsStore.getState();
  
  if (state.user) {
    // User logged in -> start polling
    notifStore.startPolling();
  } else {
    // User logged out -> stop and clear
    notifStore.clearForUser();
  }
});
