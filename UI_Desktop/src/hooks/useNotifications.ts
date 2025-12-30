/**
 * Backwards-compatible wrapper for legacy imports of `useNotifications`.
 *
 * The project uses a single notifications store. New hooks live in
 * `useNotificationBadges.ts`. To avoid duplicate polling and to remain
 * compatible with older imports, re-export the new hooks here.
 */

import {
	useNotifications as _useNotifications,
	useNotificationBadges as _useNotificationBadges,
} from './useNotificationBadges';

export const useNotifications = _useNotifications;
export const useNotificationBadges = _useNotificationBadges;

export default useNotifications;

