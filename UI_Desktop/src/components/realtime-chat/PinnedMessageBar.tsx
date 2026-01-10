/**
 * PinnedMessageBar - Shows pinned messages at top of chat with multi-pin navigation
 * - Shows most recent pinned message first
 * - Click bar: navigate to message, then cycle to next pinned
 * - List button: opens modal with all pinned messages
 */

import { useState, useCallback } from 'react';
import { useThemeStore } from '../../theme/themeStore';
import { useRTChatStore, type MessageUI } from '../../state/rt_chat_store';
import { getMessageSnippet } from '../../utils/chatHelpers';
import Icon from '../ui/Icon';

interface PinnedMessageBarProps {
  conversationId: string;
  onScrollToMessage: (messageId: string) => void;
  onOpenPinnedList: () => void;
}

export default function PinnedMessageBar({ 
  conversationId, 
  onScrollToMessage,
  onOpenPinnedList
}: PinnedMessageBarProps) {
  const isDarkMode = useThemeStore(state => state.isDarkMode);
  const messages = useRTChatStore(state => state.messagesByConv[conversationId] || []);
  const pinnedIds = useRTChatStore(state => state.pinnedMessagesByConv[conversationId] || []);
  const unpinMessage = useRTChatStore(state => state.unpinMessage);
  
  // Track current index for cycling through pinned messages (start at 0 = most recent)
  // IMPORTANT: All hooks must be called before any conditional returns
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Ensure currentIndex is valid (in case pins were removed)
  const validIndex = Math.min(currentIndex, pinnedIds.length - 1);
  const pinnedMessageId = pinnedIds[validIndex] || '';
  const pinnedMessage = messages.find(m => m.id === pinnedMessageId);
  
  const handleBarClick = useCallback(() => {
    if (!pinnedMessageId) return;
    // Navigate to current pinned message
    onScrollToMessage(pinnedMessageId);
    
    // Cycle to next pinned message (wrap around)
    if (pinnedIds.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % pinnedIds.length);
    }
  }, [pinnedMessageId, pinnedIds.length, onScrollToMessage]);
  
  // Early return AFTER all hooks
  if (pinnedIds.length === 0) return null;
  
  if (!pinnedMessage) {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 border-b ${
        isDarkMode
          ? 'bg-blue-950/30 border-blue-500/20'
          : 'bg-blue-50/80 border-blue-200/50'
      } backdrop-blur-md`}>
        <Icon name="pin" size="sm" className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-medium ${
            isDarkMode ? 'text-blue-300' : 'text-blue-700'
          }`}>
            Tin nhắn đã ghim {pinnedIds.length > 1 && `(${validIndex + 1}/${pinnedIds.length})`}
          </div>
          <div className={`text-sm ${
            isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
          }`}>
            Tin nhắn không có trong lịch sử hiện tại
          </div>
        </div>
        {pinnedIds.length > 1 && (
          <button
            onClick={onOpenPinnedList}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'hover:bg-white/10 text-zinc-400 hover:text-white'
                : 'hover:bg-black/5 text-zinc-600 hover:text-zinc-900'
            }`}
            title="Xem danh sách tin nhắn đã ghim"
          >
            <Icon name="list" size="sm" />
          </button>
        )}
        <button
          onClick={() => unpinMessage(conversationId, pinnedMessageId)}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'hover:bg-white/10 text-zinc-400 hover:text-white'
              : 'hover:bg-black/5 text-zinc-600 hover:text-zinc-900'
          }`}
          title="Bỏ ghim"
        >
          <Icon name="close" size="sm" />
        </button>
      </div>
    );
  }
  
  const snippet = getMessageSnippet(pinnedMessage, 60);
  
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b transition-colors ${
        isDarkMode
          ? 'bg-blue-950/30 border-blue-500/20 hover:bg-blue-950/40'
          : 'bg-blue-50/80 border-blue-200/50 hover:bg-blue-100/80'
      } backdrop-blur-md`}
    >
      <button
        onClick={handleBarClick}
        className="flex-1 flex items-center gap-3 min-w-0 text-left"
      >
        <Icon name="pin" size="sm" className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-medium mb-0.5 flex items-center gap-2 ${
            isDarkMode ? 'text-blue-300' : 'text-blue-700'
          }`}>
            <span>Tin nhắn đã ghim</span>
            {pinnedIds.length > 1 && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                isDarkMode ? 'bg-blue-500/30' : 'bg-blue-200'
              }`}>
                {validIndex + 1}/{pinnedIds.length}
              </span>
            )}
          </div>
          <div className={`text-sm truncate ${
            isDarkMode ? 'text-zinc-200' : 'text-zinc-700'
          }`}>
            {snippet}
          </div>
        </div>
      </button>
      
      {pinnedIds.length > 1 && (
        <button
          onClick={onOpenPinnedList}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'hover:bg-white/10 text-zinc-400 hover:text-white'
              : 'hover:bg-black/5 text-zinc-600 hover:text-zinc-900'
          }`}
          title="Xem danh sách tin nhắn đã ghim"
        >
          <Icon name="list" size="sm" />
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          unpinMessage(conversationId, pinnedMessageId);
          // Reset index if we just unpinned the current one
          if (validIndex >= pinnedIds.length - 1) {
            setCurrentIndex(0);
          }
        }}
        className={`p-2 rounded-lg transition-colors ${
          isDarkMode
            ? 'hover:bg-white/10 text-zinc-400 hover:text-white'
            : 'hover:bg-black/5 text-zinc-600 hover:text-zinc-900'
        }`}
        title="Bỏ ghim"
      >
        <Icon name="close" size="sm" />
      </button>
    </div>
  );
}
