import { useState } from "react";
import ChatSidebar from "./ChatSidebar";
import ChatRoom from "./ChatRoom";
import Icon from "../ui/Icon";
import { useUIStore } from "../../state/ui_store";

type MinimizedChat = {
  id: string;
  name: string;
  avatar?: string;
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeId, setActiveId] = useState("bot");
  const [minimizedChats, setMinimizedChats] = useState<MinimizedChat[]>([]);
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  // Mapping tên conversation
  const conversationNames: Record<string, string> = {
    bot: "Chatbot AI",
    user1: "Nguyễn Văn A",
    user2: "Lê Thị B",
  };

  const handleMinimize = () => {
    const chatName = conversationNames[activeId] || activeId;
    const existingIndex = minimizedChats.findIndex(c => c.id === activeId);
    
    // Nếu chưa có trong danh sách minimized
    if (existingIndex === -1 && minimizedChats.length < 3) {
      setMinimizedChats([...minimizedChats, { id: activeId, name: chatName }]);
    }
    
    setOpen(false);
    setMinimized(false);
  };

  const handleRestoreChat = (chatId: string) => {
    setActiveId(chatId);
    setOpen(true);
    setMinimized(false);
    // Xóa khỏi danh sách minimized
    setMinimizedChats(minimizedChats.filter(c => c.id !== chatId));
  };

  const handleRemoveMinimized = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMinimizedChats(minimizedChats.filter(c => c.id !== chatId));
  };

  return (
    <>
      {/* Minimized chats - hiển thị dưới dạng avatar tròn, trên nút chat chính */}
      {!open && minimizedChats.length > 0 && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col-reverse gap-3">
          {minimizedChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => handleRestoreChat(chat.id)}
              className={`relative w-14 h-14 rounded-full shadow-ios flex items-center justify-center hover:scale-105 transition-all duration-200 group liquid-glass-hover ${
                isDarkMode
                  ? "liquid-glass-ui-dark text-white"
                  : "liquid-glass-ui text-gray-800"
              }`}
              title={`Mở lại chat với ${chat.name}`}
            >
              {/* Avatar or first letter */}
              <span className="text-xl font-bold bg-gradient-to-br from-primary to-purple-600 bg-clip-text text-transparent">
                {chat.name.charAt(0).toUpperCase()}
              </span>
              
              {/* Green dot indicator with pulse */}
              <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
              
              {/* Close button on hover */}
              <button
                onClick={(e) => handleRemoveMinimized(chat.id, e)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center text-white text-xs shadow-lg hover:scale-110"
                title="Đóng"
              >
                <Icon name="times" size="xs" />
              </button>
            </button>
          ))}
        </div>
      )}

      {!open && (
        <button
          onClick={() => {
            setOpen(true);
            setMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-blue-500 text-white shadow-ios-lg flex items-center justify-center text-2xl hover:scale-105 hover:bg-blue-600 transition-all duration-200 inner-glow"
          title="Mở chat"
        >
          <Icon name="comment-dots" size="lg" />
        </button>
      )}

      {open && !minimized && (
        <div
          role="dialog"
          aria-modal="true"
          className={`fixed bottom-4 right-4 rounded-[32px] flex z-50 overflow-hidden transition-all duration-500 ease-in-out shadow-ios-lg animate-fadeIn ${
          isDarkMode 
            ? "liquid-glass-dark" 
            : "liquid-glass"
        }`}
          style={{
            width: sidebarCollapsed ? "min(500px, calc(100vw - 48px))" : "min(780px, calc(100vw - 48px))",
            height: "min(500px, calc(100vh - 140px))",
          }}
        >
          {!sidebarCollapsed && (
            <ChatSidebar 
              onSelect={setActiveId} 
              activeId={activeId} 
              onToggle={() => setSidebarCollapsed(true)}
            />
          )}
          <div className="flex-1 flex flex-col relative">
            <ChatRoom conversationId={activeId} sidebarCollapsed={sidebarCollapsed} onExpandSidebar={() => setSidebarCollapsed(false)} />
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={handleMinimize}
              className={`rounded-full w-9 h-9 flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-ios liquid-glass-hover ${
                isDarkMode
                  ? "liquid-glass-ui-dark text-white"
                  : "liquid-glass-ui text-gray-700"
              }`}
              title="Thu nhỏ"
            >
              <Icon name="minus" size="xs" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className={`rounded-full w-9 h-9 flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-ios liquid-glass-hover hover:bg-red-500 hover:text-white ${
                isDarkMode
                  ? "liquid-glass-ui-dark text-white"
                  : "liquid-glass-ui text-gray-700"
              }`}
              title="Đóng chat"
            >
              <Icon name="times" size="xs" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
