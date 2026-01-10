/**
 * PinnedMessagesListModal - Modal showing all pinned messages in a conversation
 * - Click on any message to navigate to its location in chat
 * - Unpin button for each message
 */

import { useThemeStore } from '../../theme/themeStore';
import { useRTChatStore, type MessageUI } from '../../state/rt_chat_store';
import { getMessageSnippet } from '../../utils/chatHelpers';
import Icon from '../ui/Icon';
import { resolveMediaUrl, getInitials } from '../../utils/mediaUrl';

interface PinnedMessagesListModalProps {
  conversationId: string;
  onClose: () => void;
  onScrollToMessage: (messageId: string) => void;
}

export default function PinnedMessagesListModal({
  conversationId,
  onClose,
  onScrollToMessage
}: PinnedMessagesListModalProps) {
  const isDarkMode = useThemeStore(state => state.isDarkMode);
  const messages = useRTChatStore(state => state.messagesByConv[conversationId] || []);
  const pinnedIds = useRTChatStore(state => state.pinnedMessagesByConv[conversationId] || []);
  const unpinMessage = useRTChatStore(state => state.unpinMessage);
  
  // Get pinned message objects
  const pinnedMessages = pinnedIds
    .map(id => messages.find(m => m.id === id))
    .filter((m): m is MessageUI => m !== undefined);
  
  const handleMessageClick = (messageId: string) => {
    onScrollToMessage(messageId);
    onClose();
  };
  
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md mx-4 rounded-xl shadow-xl ${
        isDarkMode ? 'bg-zinc-900 border border-zinc-700' : 'bg-white border border-zinc-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${
          isDarkMode ? 'border-zinc-700' : 'border-zinc-200'
        }`}>
          <div className="flex items-center gap-2">
            <Icon name="pin" size="sm" className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              Tin nhắn đã ghim
            </h2>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
            }`}>
              {pinnedIds.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-white/10 text-zinc-400 hover:text-white' 
                : 'hover:bg-black/5 text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Icon name="close" size="sm" />
          </button>
        </div>
        
        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {pinnedIds.length === 0 ? (
            <div className={`p-8 text-center ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              <Icon name="pin" size="lg" className="mx-auto mb-2 opacity-50" />
              <p>Chưa có tin nhắn nào được ghim</p>
            </div>
          ) : (
            <div className="py-2">
              {pinnedIds.map((messageId, index) => {
                const message = messages.find(m => m.id === messageId);
                
                return (
                  <div
                    key={messageId}
                    className={`px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer ${
                      isDarkMode 
                        ? 'hover:bg-white/5' 
                        : 'hover:bg-black/5'
                    }`}
                    onClick={() => handleMessageClick(messageId)}
                  >
                    {/* Avatar */}
                    {message?.senderAvatarUrl ? (
                      <img
                        src={resolveMediaUrl(message.senderAvatarUrl) ?? undefined}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isDarkMode ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-200 text-zinc-600'
                      }`}>
                        {getInitials(message?.senderDisplayName || message?.senderEmail || '?')}
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`font-medium text-sm ${
                          isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
                        }`}>
                          {message?.senderDisplayName || message?.senderEmail || 'Unknown'}
                        </span>
                        <span className={`text-xs ${
                          isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                        }`}>
                          {message ? formatTime(message.createdAt) : ''}
                        </span>
                      </div>
                      
                      {message ? (
                        <p className={`text-sm truncate ${
                          isDarkMode ? 'text-zinc-300' : 'text-zinc-600'
                        }`}>
                          {message.deletedAt 
                            ? 'Tin nhắn đã bị thu hồi'
                            : getMessageSnippet(message, 80)
                          }
                        </p>
                      ) : (
                        <p className={`text-sm italic ${
                          isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                        }`}>
                          Tin nhắn không có trong lịch sử
                        </p>
                      )}
                    </div>
                    
                    {/* Unpin button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        unpinMessage(conversationId, messageId);
                      }}
                      className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                        isDarkMode
                          ? 'hover:bg-red-500/20 text-zinc-400 hover:text-red-400'
                          : 'hover:bg-red-50 text-zinc-400 hover:text-red-500'
                      }`}
                      title="Bỏ ghim"
                    >
                      <Icon name="close" size="sm" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className={`px-4 py-3 border-t ${
          isDarkMode ? 'border-zinc-700' : 'border-zinc-200'
        }`}>
          <button
            onClick={onClose}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
            }`}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
