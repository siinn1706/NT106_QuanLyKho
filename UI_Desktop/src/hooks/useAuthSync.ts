import { useEffect } from 'react';
import { useAuthStore } from '../state/auth_store';
import { authService } from '../app/auth_service';

/**
 * Hook to sync user data from backend on mount
 * This ensures user data is always up-to-date with the server
 */
export function useAuthSync() {
  const { isAuthenticated, refreshUser } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch latest user data from backend
    const syncUserData = async () => {
      try {
        console.log('🔄 Syncing user data from backend...');
        const user = await authService.getCurrentUser();
        console.log('✅ User data synced:', user);
        refreshUser(user);
      } catch (error) {
        console.error('❌ Failed to sync user data:', error);
        // Don't logout on error, user data might still be valid
      }
    };

    syncUserData();
  }, [isAuthenticated, refreshUser]);
}
