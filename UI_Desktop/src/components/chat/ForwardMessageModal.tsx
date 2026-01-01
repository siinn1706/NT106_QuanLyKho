// src/components/chat/ForwardMessageModal.tsx
/**
 * Modal for forwarding message to other conversations
 * Apple-style with multi-select capability
 */

import { useState } from 'react';
import { useThemeStore } from '../../theme/themeStore';
import { useRTChatStore, ConversationUI } from '../../state/rt_chat_store';
import { useAuthStore } from '../../state/auth_store';
import Icon from '../ui/Icon';
import { resolveMediaUrl, getInitials } from '../../utils/mediaUrl';
import { showToast } from '../../utils/toast';
import type { Attachment, ContentType } from '../../types/attachment';

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageContent: string;
  messageContentType: ContentType;
  messageAttachments?: Attachment[];
}

export default function ForwardMessageModal({
  isOpen,
  onClose,
  messageContent,
  messageContentType,
  messageAttachments
}: ForwardMessageModalProps) {
  const [selectedConvIds, setSelectedConvIds] = useState<Set<string>>(new Set());
  const [isForwarding, setIsForwarding] = useState(false);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const conversations = useRTChatStore((state) => state.conversations);
  const sendMessage = useRTChatStore((state) => state.sendMessage);
  const currentUser = useAuthStore((state) => state.user);

  if (!isOpen) return null;

  const handleToggleConversation = (convId: string) => {
    const newSet = new Set(selectedConvIds);
    if (newSet.has(convId)) {
      newSet.delete(convId);
    } else {
      newSet.add(convId);
    }
    setSelectedConvIds(newSet);
  };

  const handleForward = async () => {
    if (selectedConvIds.size === 0) {
      showToast.warning('Vui lòng chọn ít nhất một cuộc trò chuyện');
      return;
    }

    setIsForwarding(true);

    try {
      // Forward to each selected conversation
      for (const convId of selectedConvIds) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between sends
        sendMessage(convId, messageContent, messageContentType, messageAttachments);
      }

      showToast.success(`Đã chuyển tiếp tới ${selectedConvIds.size} cuộc trò chuyện`);
      onClose();
      setSelectedConvIds(new Set());
    } catch (error) {
      console.error('[ForwardMessage] Error:', error);
      showToast.error('Có lỗi xảy ra khi chuyển tiếp tin nhắn');
    } finally {
      setIsForwarding(false);
    }
  };

  // Get other member info for display
  const getConversationDisplay = (conv: ConversationUI) => {
    if (conv.type === 'group') {
      return {
        title: conv.title || 'Nhóm',
        avatar: null,
        name: conv.title || 'Nhóm'
      };
    }

    // Direct conversation - get other member
    const otherMember = conv.members.find(m => m.userId !== currentUser?.id);
    return {
      title: otherMember?.userDisplayName || otherMember?.userEmail || 'Unknown',
      avatar: resolveMediaUrl(otherMember?.userAvatarUrl),
      name: otherMember?.userDisplayName || otherMember?.userEmail || 'Unknown'
    };
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-opacity duration-200 ${
          isDarkMode ? 'bg-black/40' : 'bg-black/20'
        }`}
        style={{ backdropFilter: 'blur(8px)' }}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md rounded-[var(--radius-2xl)] border backdrop-blur-xl transition-all duration-200 ${
          isDarkMode
            ? 'border-white/20 bg-zinc-900/90'
            : 'border-white/40 bg-white/85'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: isDarkMode
            ? '0 4px 24px -4px rgba(0, 0, 0, 0.5)'
            : '0 4px 24px -4px rgba(0, 0, 0, 0.12)'
        }}
      >
        {/* Header */}
        <div className={`p-6 pb-4 border-b ${
          isDarkMode ? 'border-white/10' : 'border-black/8'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${
              isDarkMode ? 'text-zinc-50' : 'text-zinc-900'
            }`}>
              Chuyển tiếp tin nhắn
            </h3>
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                isDarkMode
                  ? 'border-white/20 bg-white/10 hover:bg-white/15'
                  : 'border-black/10 bg-black/5 hover:bg-black/10'
              }`}
            >
              <Icon name="close" size="sm" />
            </button>
          </div>
          <p className={`text-sm mt-2 ${
            isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
          }`}>
            Chọn cuộc trò chuyện để chuyển tiếp
          </p>
        </div>

        {/* Conversation list */}
        <div className="max-h-[400px] overflow-y-auto p-4">
          {conversations.length === 0 ? (
            <div className={`text-center py-8 ${
              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}>
              Chưa có cuộc trò chuyện nào
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => {
                const display = getConversationDisplay(conv);
                const isSelected = selectedConvIds.has(conv.id);

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleToggleConversation(conv.id)}
                    className={`w-full p-3 rounded-[var(--radius-lg)] border flex items-center gap-3 transition-all duration-150 ${
                      isSelected
                        ? isDarkMode
                          ? 'border-primary/40 bg-primary/10'
                          : 'border-primary/30 bg-primary/5'
                        : isDarkMode
                          ? 'border-white/10 bg-white/5 hover:bg-white/8'
                          : 'border-black/8 bg-black/3 hover:bg-black/5'
                    }`}
                  >
                    {/* Avatar */}
                    {display.avatar ? (
                      <img
                        src={display.avatar}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        }}
                      >
                        {getInitials(display.name)}
                      </div>
                    )}

                    {/* Name */}
                    <div className="flex-1 text-left min-w-0">
                      <div className={`font-medium truncate ${
                        isDarkMode ? 'text-zinc-200' : 'text-zinc-800'
                      }`}>
                        {display.title}
                      </div>
                      {conv.type === 'group' && (
                        <div className={`text-xs ${
                          isDarkMode ? 'text-zinc-500' : 'text-zinc-500'
                        }`}>
                          {conv.members.length} thành viên
                        </div>
                      )}
                    </div>

                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-primary border-primary'
                          : isDarkMode
                            ? 'border-white/30'
                            : 'border-black/20'
                      }`}
                    >
                      {isSelected && (
                        <Icon name="check" size="xs" className="text-white" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 pt-4 border-t flex gap-3 ${
          isDarkMode ? 'border-white/10' : 'border-black/8'
        }`}>
          <button
            onClick={onClose}
            disabled={isForwarding}
            className={`flex-1 px-4 py-2.5 rounded-[var(--radius-xl)] border font-medium text-sm transition-all duration-150 ${
              isDarkMode
                ? 'border-white/20 bg-white/10 text-zinc-200 hover:bg-white/15'
                : 'border-black/10 bg-black/5 text-zinc-700 hover:bg-black/8'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Huỷ
          </button>

          <button
            onClick={handleForward}
            disabled={isForwarding || selectedConvIds.size === 0}
            className="flex-1 px-4 py-2.5 rounded-[var(--radius-xl)] font-semibold text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--text-inverse)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.05)'
            }}
          >
            {isForwarding ? (
              <>
                <Icon name="spinner" size="sm" className="animate-spin inline-block mr-2" />
                Đang gửi...
              </>
            ) : (
              `Chuyển tiếp${selectedConvIds.size > 0 ? ` (${selectedConvIds.size})` : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
