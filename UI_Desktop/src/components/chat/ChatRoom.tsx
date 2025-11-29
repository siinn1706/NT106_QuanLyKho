import { useState, useEffect, useRef } from "react";
import { FaEllipsisV, FaBars, FaPaperclip, FaMicrophone, FaPaperPlane, FaTrash } from "react-icons/fa";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { useUIStore } from "../../state/ui_store";
import { useAuthStore } from "../../state/auth_store"; // [NEW] Import Auth Store
import { apiGetChatHistory, apiSendChatMessage, apiClearChatHistory, ChatMessage } from "../../app/api_client"; // [NEW] Import API mới

// Định nghĩa Type cho UI (Mapping từ API type sang UI type)
type Message = {
  id: string;
  conversationId: string; // 'bot'
  sender: "user" | "bot";
  text: string;
  createdAt: string;
};

export default function ChatRoom({ conversationId, sidebarCollapsed, onExpandSidebar }: { 
  conversationId: string;
  sidebarCollapsed?: boolean;
  onExpandSidebar?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showCategories, setShowCategories] = useState(false); // Có thể giữ hoặc bỏ tùy logic
  const [isTyping, setIsTyping] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const user = useAuthStore((state) => state.user); // [NEW] Lấy user hiện tại

  const categories = [
    { id: 'stock', label: 'Tồn kho', icon: '📦' },
    { id: 'orders', label: 'Đơn hàng', icon: '📋' },
    { id: 'suppliers', label: 'Nhà cung cấp', icon: '🏢' },
    { id: 'reports', label: 'Báo cáo', icon: '📊' },
  ];

  // Helper: Chuyển đổi dữ liệu từ API (ChatMessageData) sang UI (Message)
  const mapApiToUiMessages = (apiMessages: ChatMessage[]): Message[] => {
    return apiMessages.map((msg, index) => ({
      id: `msg-${index}-${new Date(msg.timestamp).getTime()}`,
      conversationId: "bot",
      sender: msg.role === "model" ? "bot" : "user", // API trả về 'model', UI dùng 'bot'
      text: msg.content,
      createdAt: msg.timestamp
    }));
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  };

  // [NEW] 1. Load lịch sử chat khi component mount hoặc user thay đổi
  useEffect(() => {
    if (!user?.id) return;

    const fetchHistory = async () => {
      try {
        // Chỉ tải lịch sử nếu đang ở tab Chatbot AI
        if (conversationId === 'bot') {
          const data = await apiGetChatHistory(user.id);
          setMessages(mapApiToUiMessages(data.messages));
        } else {
          // Logic cho các user khác (nếu có tính năng chat người-người)
          setMessages([]);
        }
      } catch (error) {
        console.error("Failed to load chat history", error);
      }
    };

    fetchHistory();
  }, [user?.id, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // [NEW] 2. Xử lý gửi tin nhắn
  const handleSend = async () => {
    if (!inputValue.trim() || !user?.id) return;
    
    const userText = inputValue;
    setInputValue(""); // Clear input ngay lập tức

    // A. Optimistic Update: Hiển thị tin nhắn User ngay lập tức để UI mượt
    const tempUserMsg: Message = {
      id: "temp-user-" + Date.now(),
      conversationId,
      sender: "user",
      text: userText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsTyping(true);

    try {
      // B. Gọi API gửi tin (Backend sẽ lưu và gọi Gemini)
      const data = await apiSendChatMessage(user.id, userText);
      
      // C. Cập nhật lại toàn bộ tin nhắn từ Server (đảm bảo đồng bộ dữ liệu chuẩn)
      setMessages(mapApiToUiMessages(data.messages));
      
    } catch (e: any) {
      console.error(e);
      // Hiển thị lỗi giả lập nếu API fail
      const errMsg: Message = {
        id: "error-" + Date.now(),
        conversationId,
        sender: "bot",
        text: `⚠️ Lỗi kết nối: ${e?.message || "Không thể gửi tin nhắn"}`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // [NEW] 3. Hàm xóa lịch sử (gắn vào nút thùng rác nếu muốn)
  const handleClearChat = async () => {
    if(!user?.id || !confirm("Bạn có chắc muốn xóa toàn bộ lịch sử chat?")) return;
    try {
      await apiClearChatHistory(user.id);
      setMessages([]);
    } catch (e) {
      alert("Không thể xóa lịch sử");
    }
  }

  const getTime = (d: string) => {
    try {
        return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch { return ""; }
  }

  return (
    <div className={`flex flex-col h-full w-full relative ${
      isDarkMode ? "bg-zinc-950" : "bg-white"
    }`}>
      {/* Header */}
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
                isDarkMode ? "liquid-glass-ui-dark text-white" : "liquid-glass-ui text-gray-800"
              }`}
            >
              <FaBars size={14} />
            </button>
          )}
          <h2 className={`font-semibold ${isDarkMode ? "text-white" : "text-zinc-800"}`}>
            Chatbot AI
          </h2>
        </div>
        
        {/* Nút tùy chọn thêm */}
        <div className="flex gap-2">
            <button 
                onClick={handleClearChat}
                className={`p-2 rounded-full hover:bg-red-500 hover:text-white transition-colors ${isDarkMode ? "text-zinc-400" : "text-zinc-600"}`}
                title="Xóa lịch sử chat"
            >
                <FaTrash size={14} />
            </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fadeIn">
            <div className={`text-sm mb-4 ${isDarkMode ? "text-zinc-400" : "text-zinc-600"}`}>
              Xin chào <b>{user?.name || "Bạn"}</b>! Tôi có thể giúp gì?
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setInputValue(`Tôi cần trợ giúp về ${cat.label.toLowerCase()}`);
                    inputRef.current?.focus();
                  }}
                  className={`px-4 py-3 rounded-lg border transition transform active:scale-95 ${
                    isDarkMode
                      ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white"
                      : "bg-white border-zinc-300 hover:bg-zinc-50 text-zinc-900"
                  }`}
                >
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className="text-sm font-medium">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((m, index) => {
          const next = messages[index + 1];
          const isSameSender = next && next.sender === m.sender;
          // Logic gom nhóm tin nhắn
          const isLastInGroup = !isSameSender; 

          return (
            <MessageBubble
              key={m.id}
              text={m.text}
              time={getTime(m.createdAt)}
              mine={m.sender === "user"}
              isLastInGroup={isLastInGroup}
            />
          );
        })}
        
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`flex items-center gap-3 p-4 border-t ${
        isDarkMode
          ? "liquid-glass-ui-dark border-white/5"
          : "liquid-glass-ui border-black/5"
      }`}>
        <button className={`p-2.5 rounded-full transition-all duration-150 hover:scale-105 ${
          isDarkMode ? "text-zinc-400 hover:bg-zinc-800/50" : "text-gray-600 hover:bg-gray-200/50"
        }`}><FaPaperclip size={18} /></button>
        
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          type="text"
          disabled={isTyping} // Disable khi đang đợi trả lời để tránh spam
          placeholder="Nhập tin nhắn..."
          className={`flex-1 px-4 py-2.5 rounded-[24px] focus:outline-none focus:ring-1 transition-all ${
            isDarkMode
              ? "liquid-glass-ui-dark text-white placeholder-zinc-500 focus:ring-blue-500/20"
              : "liquid-glass-ui text-gray-900 placeholder-gray-400 focus:ring-blue-500/30"
          }`}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isTyping) {
              e.preventDefault(); handleSend();
            }
          }}
        />
        
        <button 
            className={`p-3 rounded-full transition-all duration-150 shadow-ios-lg liquid-glass-hover ${
                !inputValue.trim() || isTyping 
                ? "bg-gray-400 cursor-not-allowed opacity-50" 
                : "bg-blue-500 hover:bg-blue-600 hover:scale-105 text-white"
            }`}
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
        >
          <FaPaperPlane size={18} />
        </button>
      </div>
    </div>
  );
}