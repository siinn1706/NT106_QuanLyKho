import React, { useState } from 'react';
import { useUIStore } from '../../state/ui_store';
import { FaThumbtack, FaChevronLeft } from 'react-icons/fa';

type ConversationSummary = {
  id: string;
  name: string;
  avatarUrl?: string;
  isBot: boolean;
  lastMessagePreview?: string;
  unreadCount?: number;
};

const BOT_CONVERSATION: ConversationSummary = {
  id: "bot",
  name: "Chatbot AI",
  avatarUrl: "/bot-avatar.png",
  isBot: true,
  lastMessagePreview: "Xin chào! Tôi là trợ lý N3T.",
  unreadCount: 0,
};

const MOCK_USERS: ConversationSummary[] = [
  { id: "u1", name: "Nguyễn Văn A", avatarUrl: "/avatar1.png", isBot: false, lastMessagePreview: "Ok rồi nhé!", unreadCount: 1 },
  { id: "u2", name: "Lê Thị B", avatarUrl: "/avatar2.png", isBot: false, lastMessagePreview: "Sẵn sàng rồi.", unreadCount: 0 }
];

export default function ChatSidebar({ onSelect, activeId, onToggle }:{
  onSelect: (id: string)=>void;
  activeId: string;
  onToggle?: () => void;
}) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  React.useEffect(() => {
    setConversations([BOT_CONVERSATION, ...MOCK_USERS]);
  }, []);

  return (
    <aside className={`w-80 flex flex-col border-r ${
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
            <FaChevronLeft size={18} />
          </button>
        )}
      </div>
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
              {c.isBot && <span className="text-primary ml-2"><FaThumbtack size={16} /></span>}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
