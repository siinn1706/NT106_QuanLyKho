import { useState, useEffect, useRef } from "react";
import Icon from "../ui/Icon";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { useUIStore } from "../../state/ui_store";
import { apiChat } from "../../app/api_client";

type Message = {
  id: string;
  conversationId: string;
  sender: "user" | "agent" | "bot";
  text: string;
  createdAt: string;
};

const MOCK_MESSAGES: Message[] = [
  { id: "m1", conversationId: "bot", sender: "bot", text: "Xin chào! Tôi là trợ lý N3T.", createdAt: new Date().toISOString() },
];

export default function ChatRoom({ conversationId, sidebarCollapsed, onExpandSidebar }: { 
  conversationId: string;
  sidebarCollapsed?: boolean;
  onExpandSidebar?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  // Category icons mapping - dùng icon name thay vì emoji
  const categoryIcons: Record<string, string> = {
    'stock': 'box',
    'orders': 'clipboard-list', 
    'suppliers': 'building',
    'reports': 'chart-bar',
  };

  const categories = [
    { id: 'stock', label: 'Tồn kho' },
    { id: 'orders', label: 'Đơn hàng' },
    { id: 'suppliers', label: 'Nhà cung cấp' },
    { id: 'reports', label: 'Báo cáo' },
  ];

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  };

  useEffect(() => {
    setMessages(MOCK_MESSAGES.filter((m) => m.conversationId === conversationId));
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const newMsg: Message = {
      id: "m" + (messages.length + 1),
      conversationId,
      sender: "user",
      text: inputValue,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    const userText = inputValue;
    setInputValue("");

    // Hiển thị typing indicator
    setIsTyping(true);

    // Gọi BE -> Gemini
    try {
      const res = await apiChat({ prompt: userText, system_instruction: "Bạn là trợ lý kho N3T, trả lời ngắn gọn." });
      const botMsg: Message = {
        id: "m" + (messages.length + 2),
        conversationId,
        sender: "bot",
        text: res.reply,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      const errMsg: Message = {
        id: "m" + (messages.length + 2),
        conversationId,
        sender: "bot",
        text: `Lỗi gọi AI: ${e?.message ?? e}`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      // Ẩn typing indicator khi đã nhận được phản hồi
      setIsTyping(false);
    }
  };

  const getTime = (d: string) =>
    new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className={`flex flex-col h-full w-full relative ${
      isDarkMode ? "bg-zinc-950" : "bg-white"
    }`}>
      <div className={`flex justify-between items-center gap-3 px-6 py-4 border-b ${
        isDarkMode 
          ? "liquid-glass-ui-dark border-white/5" 
          : "liquid-glass-ui border-black/5"
      }`}>
        <div className="flex items-center gap-2">
          {sidebarCollapsed && onExpandSidebar && (
            <button
              onClick={onExpandSidebar}
              className={`rounded-full w-8 h-8 flex items-center justify-center transition-all duration-150 hover:scale-105 shadow-ios liquid-glass-hover ${
                isDarkMode
                  ? "liquid-glass-ui-dark text-white"
                  : "liquid-glass-ui text-gray-800"
              }`}
              title="Mở danh sách"
            >
              <Icon name="bars" size="sm" />
            </button>
          )}
          <h2 className={`font-semibold ${
            isDarkMode ? "text-white" : "text-zinc-800"
          }`}>Chat với Chatbot AI</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className={`text-sm mb-4 ${isDarkMode ? "text-zinc-400" : "text-zinc-600"}`}>
              Xin chào! Tôi có thể giúp gì cho bạn?
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setInputValue(`Tôi cần trợ giúp về ${cat.label.toLowerCase()}`);
                    setShowCategories(false);
                  }}
                  className={`px-4 py-3 rounded-lg border transition ${
                    isDarkMode
                      ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white"
                      : "bg-white border-zinc-300 hover:bg-zinc-50 text-zinc-900"
                  }`}
                >
                  <div className="text-2xl mb-1">
                    <Icon name={categoryIcons[cat.id]} size="lg" className="text-primary" />
                  </div>
                  <div className="text-sm font-medium">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, index) => {
          const next = messages[index + 1];
          const isSameSender = next && next.sender === m.sender;

          const currentTime = getTime(m.createdAt);
          const nextTime = next ? getTime(next.createdAt) : undefined;
          const isSameTime = next && nextTime === currentTime;

          const isLastInGroup = !(isSameSender && isSameTime);

          return (
            <MessageBubble
              key={m.id}
              text={m.text}
              time={currentTime}
              mine={m.sender === "user"}
              isLastInGroup={isLastInGroup}
            />
          );
        })}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <div className={`flex items-center gap-3 p-4 border-t ${
        isDarkMode
          ? "liquid-glass-ui-dark border-white/5"
          : "liquid-glass-ui border-black/5"
      }`}>
        <button className={`p-2.5 rounded-full transition-all duration-150 hover:scale-105 ${
          isDarkMode ? "text-zinc-400 hover:bg-zinc-800/50" : "text-gray-600 hover:bg-gray-200/50"
        }`} title="Gửi file"><Icon name="paperclip" size="md" /></button>
        <button className={`p-2.5 rounded-full transition-all duration-150 hover:scale-105 ${
          isDarkMode ? "text-zinc-400 hover:bg-zinc-800/50" : "text-gray-600 hover:bg-gray-200/50"
        }`} title="Ghi âm"><Icon name="microphone" size="md" /></button>
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          type="text"
          placeholder="Nhập tin nhắn..."
          className={`flex-1 px-4 py-2.5 rounded-[24px] focus:outline-none focus:ring-1 transition-all hover:scale-[1.02] hover:-translate-y-0.5 ${
            isDarkMode
              ? "liquid-glass-ui-dark text-white placeholder-zinc-500 focus:ring-blue-500/20"
              : "liquid-glass-ui text-gray-900 placeholder-gray-400 focus:ring-blue-500/30"
          }`}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); handleSend();
            }
          }}
        />
        <button className="text-white p-3 rounded-full bg-blue-500 hover:bg-blue-600 hover:scale-105 transition-all duration-150 shadow-ios-lg liquid-glass-hover" onClick={handleSend} title="Gửi">
          <Icon name="paper-plane" size="md" />
        </button>
      </div>
    </div>
  );
}
