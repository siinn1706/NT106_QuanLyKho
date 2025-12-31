import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../../theme/themeStore';
import { useRTChatStore } from '../../state/rt_chat_store';
import { useAuthStore } from '../../state/auth_store';
import NewChatModal from '../realtime-chat/NewChatModal';
import Icon from '../ui/Icon';
import { BASE_URL } from '../../app/api_client';

type ConversationSummary = {
  id: string;
  name: string;
  avatarUrl?: string;
  isBot: boolean;
  lastMessagePreview?: string;
  unreadCount?: number;
};

export default function ChatSidebar({ onSelect, activeId, onToggle }:{
  onSelect: (id: string)=>void;
  activeId: string | null;
  onToggle?: () => void;
}) {
  const [botAvatar, setBotAvatar] = useState<string>("/bot-avatar.png");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const currentUser = useAuthStore((state) => state.user);
  const rtConversations = useRTChatStore((state) => state.conversations);
  const pendingConversations = useRTChatStore((state) => state.pendingConversations);
  const loadConversations = useRTChatStore((state) => state.loadConversations);
  const loadPendingConversations = useRTChatStore((state) => state.loadPendingConversations);
  const acceptConversation = useRTChatStore((state) => state.acceptConversation);

  // Load bot avatar từ API
  useEffect(() => {
    fetch(`${BASE_URL}/api/chatbot/config`)
      .then(res => res.json())
      .then(data => {
        if (data.avatar_url) {
          const avatarUrl = data.avatar_url.startsWith('http') 
            ? data.avatar_url 
            : `${BASE_URL}${data.avatar_url}`;
          setBotAvatar(avatarUrl);
        }
      })
      .catch(err => console.error('Error loading bot avatar:', err));
  }, []);

  // Load pending conversations
  useEffect(() => {
    loadPendingConversations();
    
    // Poll every 30 seconds for new pending messages
    const interval = setInterval(() => {
      loadPendingConversations();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loadPendingConversations]);

  return (
    <aside className={`w-80 shrink-0 flex flex-col border-r overflow-hidden ${
      isDarkMode 
        ? "bg-zinc-900 text-white border-zinc-800" 
        : "bg-zinc-50 text-zinc-900 border-zinc-300"
    }`}>
      <div className={`p-4 flex items-center justify-between border-b ${
        isDarkMode ? "border-zinc-800" : "border-zinc-300"
      }`}>
        <input
          placeholder="Tìm kiếm hội thoại..."
          className={`flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
            isDarkMode
              ? "bg-zinc-800 text-zinc-200 placeholder-zinc-400"
              : "bg-white text-zinc-900 placeholder-zinc-500 border border-zinc-300"
          }`}
        />
        {onToggle && (
          <button
            onClick={onToggle}
            className={`ml-3 p-2 rounded-lg transition ${
              isDarkMode
                ? "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                : "hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900"
            }`}
            title="Thu gọn danh sách"
          >
            <Icon name="chevron-left" size="md" />
          </button>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-3 border-b border-zinc-800">
        <button
          onClick={() => setShowNewChatModal(true)}
          className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            isDarkMode
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          <Icon name="plus" size="md" />
          <span>Cuộc trò chuyện mới</span>
        </button>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onSuccess={async (conversationId) => {
            // Reload conversations to ensure we have the latest data
            await loadConversations();
            onSelect(conversationId);
            setShowNewChatModal(false);
          }}
        />
      )}
      
      <div className="flex-1 overflow-y-auto">
        {/* Bot conversation */}
        <button
          className={`w-full flex items-center p-3 gap-4 transition ${
            isDarkMode
              ? `hover:bg-zinc-800 ${activeId === "bot" ? "bg-zinc-800" : ""}`
              : `hover:bg-zinc-200 ${activeId === "bot" ? "bg-zinc-200" : ""}`
          }`}
          onClick={() => onSelect("bot")}
        >
          <img src={botAvatar} alt="Bot" className="w-12 h-12 rounded-full" />
          <div className="flex-1 text-left truncate">
            <div className="font-bold text-lg truncate">Chatbot AI</div>
            <div className={`text-sm truncate ${
              isDarkMode ? "text-zinc-400" : "text-zinc-600"
            }`}>Xin chào! Tôi là trợ lý N3T.</div>
          </div>
        </button>

        {/* PENDING/SPAM SECTION - Only show if there are pending conversations */}
        {pendingConversations.length > 0 && (
          <div className="mt-2 border-t border-b border-red-500/30 bg-red-500/10">
            <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider ${
              isDarkMode ? "text-red-400" : "text-red-600"
            }`}>
              Tin nhắn chờ ({pendingConversations.length})
            </div>
            {pendingConversations.map((conv) => {
              const otherMember = conv.members.find(m => m.userId !== currentUser?.id);
              const avatar = otherMember?.userAvatarUrl;
              const name = otherMember?.userDisplayName || otherMember?.userEmail || "User";
              const preview = conv.lastMessage?.content || "Tin nhắn mới";
              
              return (
                <div
                  key={conv.id}
                  className={`w-full flex items-center p-3 gap-3 border-b ${
                    isDarkMode ? "border-zinc-800" : "border-zinc-200"
                  }`}
                >
                  {avatar ? (
                    <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{name}</div>
                    <div className={`text-xs truncate ${
                      isDarkMode ? "text-zinc-400" : "text-zinc-600"
                    }`}>{preview}</div>
                  </div>
                  <button
                    onClick={() => acceptConversation(conv.id)}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                      isDarkMode
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                    title="Chấp nhận"
                  >
                    Chấp nhận
                  </button>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Realtime conversations */}
        {rtConversations.map((conv) => {
          const isActive = activeId === conv.id;
          const otherMember = conv.members.find(m => m.userId !== currentUser?.id);
          const avatar = otherMember?.userAvatarUrl;
          const name = otherMember?.userDisplayName || otherMember?.userEmail || "User";
          const preview = conv.lastMessage?.content || "Bắt đầu cuộc trò chuyện...";
          
          return (
            <button
              key={conv.id}
              className={`w-full flex items-center p-3 gap-4 transition ${
                isDarkMode
                  ? `hover:bg-zinc-800 ${isActive ? "bg-zinc-800" : ""}`
                  : `hover:bg-zinc-200 ${isActive ? "bg-zinc-200" : ""}`
              }`}
              onClick={() => onSelect(conv.id)}
            >
              {avatar ? (
                <img src={avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 text-left truncate">
                <div className="font-bold text-lg truncate">{name}</div>
                <div className={`text-sm truncate ${
                  isDarkMode ? "text-zinc-400" : "text-zinc-600"
                }`}>{preview}</div>
              </div>
              {conv.unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{conv.unreadCount}</span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
