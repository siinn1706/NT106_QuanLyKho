import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../../theme/themeStore';
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
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [botAvatar, setBotAvatar] = useState<string>("/bot-avatar.png");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

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

  useEffect(() => {
    const botConversation: ConversationSummary = {
      id: "bot",
      name: "Chatbot AI",
      avatarUrl: botAvatar,
      isBot: true,
      lastMessagePreview: "Xin chào! Tôi là trợ lý N3T.",
      unreadCount: 0,
    };
    setConversations([botConversation]);
  }, [botAvatar]);

  // Search users
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/users?search=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    }
  };

  const handleStartChat = (user: any) => {
    const newConversation: ConversationSummary = {
      id: user.id,
      name: user.display_name || user.username,
      avatarUrl: user.avatar_url ? `${BASE_URL}${user.avatar_url}` : undefined,
      isBot: false,
      lastMessagePreview: "Bắt đầu cuộc trò chuyện...",
      unreadCount: 0,
    };
    
    // Add to conversations nếu chưa có
    if (!conversations.find(c => c.id === user.id)) {
      setConversations([...conversations, newConversation]);
    }
    
    onSelect(user.id);
    setShowNewChatModal(false);
    setSearchQuery("");
    setSearchResults([]);
  };

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
        <div className="absolute inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
          <div className={`w-96 rounded-lg shadow-xl ${isDarkMode ? "bg-zinc-800" : "bg-white"}`}>
            <div className={`p-4 border-b ${isDarkMode ? "border-zinc-700" : "border-zinc-200"}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">Tìm người dùng</h3>
                <button
                  onClick={() => {
                    setShowNewChatModal(false);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="p-1 hover:bg-zinc-700 rounded"
                >
                  <Icon name="close" size="sm" />
                </button>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Nhập tên người dùng..."
                autoFocus
                className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode
                    ? "bg-zinc-700 text-white placeholder-zinc-400"
                    : "bg-zinc-100 text-zinc-900 placeholder-zinc-500"
                }`}
              />
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {searchResults.length === 0 && searchQuery.length >= 2 && (
                <p className="text-center py-8 text-zinc-500">Không tìm thấy người dùng</p>
              )}
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleStartChat(user)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-700 transition`}
                >
                  {user.avatar_url ? (
                    <img
                      src={`${BASE_URL}${user.avatar_url}`}
                      alt={user.display_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      {(user.display_name || user.username).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-medium">{user.display_name || user.username}</div>
                    <div className="text-sm text-zinc-400">@{user.username}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto">
        {conversations.map((c: ConversationSummary) => {
          const isActive = activeId === c.id;
          return (
            <button
              key={c.id}
              className={`w-full flex items-center p-3 gap-4 transition ${
                isDarkMode
                  ? `hover:bg-zinc-800 ${isActive ? "bg-zinc-800" : ""}`
                  : `hover:bg-zinc-200 ${isActive ? "bg-zinc-200" : ""}`
              }`}
              onClick={() => onSelect(c.id)}
            >
              <img src={c.avatarUrl ?? "/default-avatar.png"} alt="" className="w-12 h-12 rounded-full" />
              <div className="flex-1 text-left truncate">
                <div className="font-bold text-lg truncate">{c.name}</div>
                <div className={`text-sm truncate ${
                  isDarkMode ? "text-zinc-400" : "text-zinc-600"
                }`}>{c.lastMessagePreview}</div>
              </div>
              {(c.unreadCount ?? 0) > 0 && (
                <span className="bg-primary text-xs rounded-full px-2 py-0.5">{c.unreadCount}</span>
              )}
              {c.isBot && <Icon name="thumbtack" size="md" className="text-primary ml-2" />}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
