import { useState, useEffect } from "react";
import ChatSidebar from "./ChatSidebar";
import ChatRoom from "./ChatRoom";
import RealtimeChatRoom from "../realtime-chat/RealtimeChatRoom";
import { useThemeStore } from "../../theme/themeStore";
import { useRTChatStore } from "../../state/rt_chat_store";
import { useAuthStore } from "../../state/auth_store";
import Icon from "../ui/Icon";
import { BASE_URL } from "../../app/api_client";
import { resolveMediaUrl, getInitials } from "../../utils/mediaUrl";

type MinimizedChat = {
  id: string;
  name: string;
  avatar?: string;
};

type DockState = {
  edge: 'right' | 'bottom';
  offset: number;
};

const STORAGE_KEY = 'chat-widget-dock-state';
const EDGE_SNAP_THRESHOLD = 80;
const DRAG_THRESHOLD = 8;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [minimizedChats, setMinimizedChats] = useState<MinimizedChat[]>([]);
  const [botAvatar, setBotAvatar] = useState<string | null>(null);
  const [dockState, setDockState] = useState<DockState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { edge: 'right', offset: 100 };
    } catch {
      return { edge: 'right', offset: 100 };
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const currentUser = useAuthStore(state => state.user);
  const conversations = useRTChatStore(state => state.conversations);

  // Load bot avatar từ API
  useEffect(() => {
    console.log('🔵 ChatWidget: Loading bot avatar...');
    fetch(`${BASE_URL}/api/chatbot/config`)
      .then(res => res.json())
      .then(data => {
        console.log('🔵 ChatWidget: Bot config loaded:', data);
        if (data.avatar_url) {
          const avatarUrl = data.avatar_url.startsWith('http') 
            ? data.avatar_url 
            : `${BASE_URL}${data.avatar_url}`;
          console.log('🔵 ChatWidget: Bot avatar URL:', avatarUrl);
          setBotAvatar(avatarUrl);
        }
      })
      .catch(err => console.error('❌ Error loading bot avatar:', err));
  }, []);

  // Mapping tên conversation
  const conversationNames: Record<string, string> = {
    bot: "Chatbot AI",
    user1: "Nguyễn Văn A",
    user2: "Lê Thị B",
  };

  const handleMinimize = () => {
    if (!activeId) return;
    
    let chatName = conversationNames[activeId] || activeId;
    let avatar: string | undefined = undefined;
    
    if (activeId === "bot") {
      chatName = "Chatbot AI";
      avatar = botAvatar || undefined;
    } else {
      const conversation = conversations.find(c => c.id === activeId);
      if (conversation && currentUser) {
        const otherMember = conversation.members.find(m => m.userId !== currentUser.id);
        if (otherMember) {
          chatName = otherMember.userDisplayName || otherMember.userEmail || "User";
          avatar = otherMember.userAvatarUrl ? resolveMediaUrl(otherMember.userAvatarUrl) || undefined : undefined;
        }
      }
    }
    
    const existingIndex = minimizedChats.findIndex(c => c.id === activeId);
    
    if (existingIndex === -1 && minimizedChats.length < 3) {
      setMinimizedChats([...minimizedChats, { 
        id: activeId, 
        name: chatName,
        avatar: avatar 
      }]);
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

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragStart({ x: e.clientX, y: e.clientY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStart) return;

    const deltaX = Math.abs(e.clientX - dragStart.x);
    const deltaY = Math.abs(e.clientY - dragStart.y);

    if (!isDragging && (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)) {
      setIsDragging(true);
    }

    if (!isDragging) return;

    const distanceFromBottom = window.innerHeight - e.clientY;
    const shouldSnapToBottom = distanceFromBottom < EDGE_SNAP_THRESHOLD;

    if (shouldSnapToBottom) {
      const newOffset = Math.max(24, Math.min(e.clientX, window.innerWidth - 200));
      setDockState({ edge: 'bottom', offset: newOffset });
    } else {
      const newOffset = Math.max(24, Math.min(e.clientY, window.innerHeight - 200));
      setDockState({ edge: 'right', offset: newOffset });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    if (isDragging) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dockState));
      } catch {}
      setIsDragging(false);
      setDragStart(null);
    } else {
      setDragStart(null);
    }
  };

  const handleClick = (e: React.MouseEvent, chatId: string) => {
    if (!isDragging) {
      handleRestoreChat(chatId);
    }
  };

  const getDockStyle = (): React.CSSProperties => {
    if (dockState.edge === 'right') {
      return {
        position: 'fixed',
        right: '24px',
        top: `${dockState.offset}px`,
        flexDirection: 'column-reverse',
        gap: '12px',
      };
    } else {
      return {
        position: 'fixed',
        bottom: '24px',
        left: `${dockState.offset}px`,
        flexDirection: 'row',
        gap: '12px',
      };
    }
  };

  return (
    <>
      {/* Minimized chats - hiển thị dưới dạng avatar tròn, draggable dock */}
      {!open && minimizedChats.length > 0 && (
        <div 
          className={`z-50 flex ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={getDockStyle()}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {minimizedChats.map((chat) => (
            <div key={chat.id} className="relative group">
              <button
                onClick={(e) => handleClick(e as any, chat.id)}
                className={`relative w-14 h-14 rounded-full shadow-ios flex items-center justify-center hover:scale-105 transition-all duration-200 overflow-hidden border-2 ${
                  chat.avatar ? "border-blue-500" : ""
                } ${
                  isDarkMode
                    ? "liquid-glass-ui-dark text-white"
                    : "liquid-glass-ui text-gray-800"
                }`}
                title={`Mở lại chat với ${chat.name}`}
              >
                {/* Avatar image hoặc chữ cái */}
                {chat.avatar ? (
                  <img 
                    src={chat.avatar} 
                    alt={chat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold bg-gradient-to-br from-primary to-purple-600 bg-clip-text text-transparent">
                    {chat.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
              
              {/* Green dot indicator with pulse - bên ngoài button */}
              <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white animate-pulse z-10"></span>
              
              {/* Close button on hover - bên ngoài button */}
              <button
                onClick={(e) => handleRemoveMinimized(chat.id, e)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center text-white text-xs shadow-lg hover:scale-110 z-10"
                title="Đóng"
              >
                <Icon name="close" size="xs" />
              </button>
            </div>
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
          className={`fixed bottom-4 right-4 rounded-[32px] flex z-50 overflow-hidden transition-all duration-500 ease-in-out shadow-ios-lg animate-fadeIn border ${
            isDarkMode 
              ? "bg-zinc-900 border-zinc-700" 
              : "bg-white border-zinc-300"
          }`}
          style={{
            width: sidebarCollapsed ? "min(500px, calc(100vw - 48px))" : "min(780px, calc(100vw - 48px))",
            height: "min(500px, calc(100vh - 140px))",
          }}
        >
          {/* Button mở rộng sidebar khi collapsed */}
          {sidebarCollapsed && (
            <div className="absolute top-3 left-3 z-50">
              <button
                onClick={() => {
                  console.log('🔵 Expand button clicked - expanding sidebar');
                  setSidebarCollapsed(false);
                }}
                className={`w-12 h-12 rounded-full shadow-lg hover:scale-110 transition-all duration-200 flex items-center justify-center ${
                  activeId 
                    ? "overflow-hidden border-2 border-blue-500 bg-white" 
                    : isDarkMode 
                      ? "liquid-glass-ui-dark text-white" 
                      : "liquid-glass-ui text-gray-700"
                }`}
                title="Mở danh sách chat"
              >
                {activeId ? (
                  // Hiển thị avatar của người đang chat
                  activeId === "bot" && botAvatar ? (
                    <img 
                      src={botAvatar} 
                      alt="Chatbot" 
                      className="w-full h-full object-cover"
                      onLoad={() => console.log('✅ Avatar collapsed button loaded')}
                      onError={() => console.error('❌ Avatar collapsed button failed')}
                    />
                  ) : (
                    <span className="text-xl font-bold bg-gradient-to-br from-primary to-purple-600 bg-clip-text text-transparent">
                      {conversationNames[activeId]?.charAt(0).toUpperCase() || "U"}
                    </span>
                  )
                ) : (
                  // Hiển thị icon 3 gạch ngang khi chưa chọn người chat
                  <Icon name="bars" size="lg" />
                )}
              </button>
            </div>
          )}
          
          {!sidebarCollapsed && (
            <ChatSidebar 
              onSelect={setActiveId} 
              activeId={activeId} 
              onToggle={() => setSidebarCollapsed(true)}
            />
          )}
          <div className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
            {activeId ? (
              activeId === "bot" ? (
                <ChatRoom conversationId={activeId} sidebarCollapsed={sidebarCollapsed} onExpandSidebar={() => setSidebarCollapsed(false)} />
              ) : (
                <RealtimeChatRoom conversationId={activeId} sidebarCollapsed={sidebarCollapsed} onExpandSidebar={() => setSidebarCollapsed(false)} />
              )
            ) : (
              <div className={`flex-1 flex flex-col items-center justify-center gap-4 ${
                isDarkMode ? "text-zinc-400" : "text-zinc-500"
              }`}>
                <Icon name="comment-dots" size="xl" className="opacity-30" />
                <div className="text-center">
                  <p className="text-lg font-medium mb-1">Chọn một cuộc trò chuyện</p>
                  <p className="text-sm opacity-70">Chọn từ danh sách bên trái để bắt đầu chat</p>
                </div>
              </div>
            )}
          </div>
          <div className="absolute top-3 right-3 flex gap-2 z-50">
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
              <Icon name="close" size="xs" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
