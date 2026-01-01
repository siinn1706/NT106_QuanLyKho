import { useState, useEffect } from "react";
import { useThemeStore } from "../../theme/themeStore";
import { useRTChatStore, MessageUI } from "../../state/rt_chat_store";
import { useAuthStore } from "../../state/auth_store";
import { BASE_URL } from "../../app/api_client";
import Icon from "../ui/Icon";
import ConfirmDialog from "../ui/ConfirmDialog";
import { resolveMediaUrl, getInitials } from "../../utils/mediaUrl";
import MessageBubble from "../chat/MessageBubble";
import { showToast } from "../../utils/toast";

interface Props {
  conversationId: string;
  conversationTitle: string;
  otherMemberAvatar?: string;
  otherMemberName: string;
  onClose: () => void;
  onAcceptSuccess: (conversationId: string) => void;
}

export default function PendingConversationPreviewModal({
  conversationId,
  conversationTitle,
  otherMemberAvatar,
  otherMemberName,
  onClose,
  onAcceptSuccess,
}: Props) {
  const [messages, setMessages] = useState<MessageUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showDeleteHistoryConfirm, setShowDeleteHistoryConfirm] = useState(false);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const currentUser = useAuthStore((state) => state.user);
  const acceptConversation = useRTChatStore((state) => state.acceptConversation);
  const rejectConversation = useRTChatStore((state) => state.rejectConversation);
  const loadConversations = useRTChatStore((state) => state.loadConversations);

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  const loadMessages = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(
        `${BASE_URL}/rt/conversations/${conversationId}/messages?limit=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load messages");
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (e) {
      console.error("[PendingPreview] Load error:", e);
      setError("Không thể tải tin nhắn");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    setError(null);

    try {
      await acceptConversation(conversationId);
      await loadConversations();
      showToast.success('Đã chấp nhận cuộc trò chuyện');
      onAcceptSuccess(conversationId);
      onClose();
    } catch (e: any) {
      console.error("[PendingPreview] Accept error:", e);
      setError(e.message || "Không thể chấp nhận cuộc trò chuyện");
      showToast.error('Không thể chấp nhận cuộc trò chuyện');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = () => {
    setShowRejectConfirm(true);
  };

  const handleConfirmReject = async () => {
    setShowRejectConfirm(false);
    setShowDeleteHistoryConfirm(true);
  };

  const handleDeleteHistory = async (deleteHistory: boolean) => {
    setIsRejecting(true);
    setShowDeleteHistoryConfirm(false);
    setError(null);

    try {
      await rejectConversation(conversationId, deleteHistory);
      await loadConversations();
      showToast.success('Đã từ chối cuộc trò chuyện');
      onClose();
    } catch (e: any) {
      console.error("[PendingPreview] Reject error:", e);
      setError(e.message || "Không thể từ chối cuộc trò chuyện");
      showToast.error('Không thể từ chối cuộc trò chuyện');
    } finally {
      setIsRejecting(false);
    }
  };

  const avatarUrl = resolveMediaUrl(otherMemberAvatar);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl h-[400px] rounded-3xl shadow-2xl border flex flex-col overflow-hidden ${
          isDarkMode ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`p-4 border-b flex items-center gap-3 ${
            isDarkMode ? "border-zinc-700" : "border-zinc-300"
          }`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-lg"
            style={{ display: avatarUrl ? "none" : "flex" }}
          >
            {getInitials(otherMemberName)}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{conversationTitle}</h2>
            <p className="text-sm text-zinc-500 truncate">{otherMemberName}</p>
          </div>

          <button
            onClick={onClose}
            className={`rounded-full w-9 h-9 flex items-center justify-center transition-all duration-200 hover:scale-105 ${
              isDarkMode ? "liquid-glass-ui-dark text-white" : "liquid-glass-ui text-gray-700"
            }`}
          >
            <Icon name="close" size="sm" />
          </button>
        </div>

        {/* Container với padding top/bottom đủ để không bị cắt tin nhắn */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {isLoading && (
            <div className="flex justify-center items-center h-full">
              <Icon name="spinner" size="md" className="animate-spin text-zinc-500" />
            </div>
          )}

          {!isLoading && error && (
            <div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          {!isLoading && !error && messages.length === 0 && (
            <div className="text-center text-zinc-500">Chưa có tin nhắn nào</div>
          )}

          {!isLoading &&
            !error &&
            messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                messageId={msg.id}
                text={msg.content}
                mine={msg.senderId === currentUser?.id}
                time={msg.createdAt}
                senderName={msg.senderDisplayName || msg.senderEmail || "User"}
                senderAvatar={resolveMediaUrl(msg.senderAvatarUrl) || undefined}
                isLastInGroup={
                  idx === messages.length - 1 ||
                  messages[idx + 1]?.senderId !== msg.senderId
                }
              />
            ))}
        </div>

        <div
          className={`p-4 border-t flex gap-3 ${
            isDarkMode ? "border-zinc-700" : "border-zinc-300"
          }`}
        >
          <button
            onClick={handleReject}
            disabled={isRejecting || isAccepting}
            className={`flex-1 px-6 py-3 rounded-[var(--radius-xl)] font-semibold border transition-all duration-150 ${
              isDarkMode
                ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 active:bg-red-500/15"
                : "border-red-500/20 bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-50"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRejecting ? (
              <>
                <Icon name="spinner" size="sm" className="animate-spin inline-block mr-2" />
                Đang xử lý...
              </>
            ) : (
              "Từ chối"
            )}
          </button>

          <button
            onClick={handleAccept}
            disabled={isAccepting || isRejecting}
            className="flex-1 px-6 py-3 rounded-[var(--radius-xl)] font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--success)',
              color: 'var(--text-inverse)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            {isAccepting ? (
              <>
                <Icon name="spinner" size="sm" className="animate-spin inline-block mr-2" />
                Đang xử lý...
              </>
            ) : (
              "Chấp nhận"
            )}
          </button>
        </div>
      </div>

      {/* Confirmation dialogs */}
      <ConfirmDialog
        isOpen={showRejectConfirm}
        title="Từ chối cuộc trò chuyện?"
        message={`Bạn có chắc muốn từ chối cuộc trò chuyện với ${otherMemberName}?`}
        confirmLabel="Từ chối"
        cancelLabel="Huỷ"
        variant="danger"
        onConfirm={handleConfirmReject}
        onCancel={() => setShowRejectConfirm(false)}
        isDarkMode={isDarkMode}
      />

      <ConfirmDialog
        isOpen={showDeleteHistoryConfirm}
        title="Xoá lịch sử tin nhắn?"
        message="Bạn có muốn xoá toàn bộ lịch sử tin nhắn của cuộc trò chuyện này không?"
        confirmLabel="Xoá lịch sử"
        cancelLabel="Giữ lại"
        variant="warning"
        onConfirm={() => handleDeleteHistory(true)}
        onCancel={() => handleDeleteHistory(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
