import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ChatBackground from "./ChatBackground";
import DateSeparator from "./DateSeparator";
import ChatDatePicker from "./ChatDatePicker";
import { AttachmentPicker, AttachmentPreview } from "./AttachmentPicker";
import { useThemeStore } from "../../theme/themeStore";
import { useChatStore, Message } from "../../state/chat_store";
import { useChatSync } from "../../hooks/useChatSync";
import { apiChat, apiUploadChatbotFile } from "../../app/api_client";
import { isImageMimeType, type Attachment, type UploadProgress } from "../../types/attachment";
import { showError } from "../../utils/toast";
import Icon from "../ui/Icon";

// Helper: Lấy date key từ ISO string (YYYY-MM-DD)
function getDateKey(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Helper: Parse date key về Date object
function parseLocalDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function ChatRoom({ conversationId, sidebarCollapsed, onExpandSidebar }: { 
  conversationId: string;
  sidebarCollapsed?: boolean;
  onExpandSidebar?: () => void;
}) {
  // Lấy messages từ store - reactive, tự động cập nhật khi store thay đổi
  const conversations = useChatStore((state) => state.conversations);
  const addMessage = useChatStore((state) => state.addMessage);
  const messages = conversations[conversationId] || [];
  
  // Sync chat với server
  const { saveMessage, saveReactions } = useChatSync({ conversationId });
  
  const [inputValue, setInputValue] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; text: string; sender: string } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());
  const [uploadedAttachments, setUploadedAttachments] = useState<Attachment[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const dateRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  
  // Lấy updateMessageReactions từ store
  const updateMessageReactions = useChatStore((state) => state.updateMessageReactions);

  // Nhóm messages theo ngày
  const messagesGroupedByDate = useMemo(() => {
    const groups: { dateKey: string; date: Date; messages: Message[] }[] = [];
    
    messages.forEach((msg) => {
      const dateKey = getDateKey(msg.createdAt);
      const lastGroup = groups[groups.length - 1];
      
      if (lastGroup && lastGroup.dateKey === dateKey) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({
          dateKey,
          date: parseLocalDateKey(dateKey),
          messages: [msg],
        });
      }
    });
    
    return groups;
  }, [messages]);
  
  // Danh sách các ngày có tin nhắn (cho date picker)
  const availableDates = useMemo(() => {
    return messagesGroupedByDate.map(g => g.date);
  }, [messagesGroupedByDate]);
  
  // Scroll đến ngày được chọn
  const scrollToDate = useCallback((date: Date) => {
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const el = dateRefs.current[dateKey];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

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

  // Scroll to bottom khi messages thay đổi hoặc conversationId thay đổi
  useEffect(() => {
    scrollToBottom();
  }, [messages, conversationId]);

  // Handler cho reaction change - update store và sync lên server
  const handleReactionChange = (messageId: string, reactions: string[]) => {
    updateMessageReactions(messageId, reactions);
    saveReactions(messageId, reactions);
  };

  const handleFilesSelected = async (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
    
    for (const file of files) {
      setUploadProgress(prev => {
        const progressMap = new Map(prev);
        progressMap.set(file.name, { file, progress: 0, status: 'uploading' });
        return progressMap;
      });
      
      try {
        const result = await apiUploadChatbotFile(file);
        
        setUploadProgress(prev => {
          const progressMapDone = new Map(prev);
          progressMapDone.set(file.name, { file, progress: 100, status: 'completed', result });
          return progressMapDone;
        });
        
        setUploadedAttachments(prev => [...prev, result]);
      } catch (error: any) {
        setUploadProgress(prev => {
          const progressMapError = new Map(prev);
          progressMapError.set(file.name, { file, progress: 0, status: 'error', error: error.message });
          return progressMapError;
        });
        
        showError(`Lỗi upload ${file.name}: ${error.message}`);
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    const file = selectedFiles[index];
    if (file) {
      setUploadProgress(prev => {
        const newMap = new Map(prev);
        newMap.delete(file.name);
        return newMap;
      });
      setUploadedAttachments(prev => prev.filter(att => att.name !== file.name));
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() && uploadedAttachments.length === 0) return;
    
    const currentReply = replyingTo ? { ...replyingTo } : null;
    const currentAttachments = [...uploadedAttachments];
    
    const contentType = currentAttachments.length > 0
      ? (currentAttachments.every(att => isImageMimeType(att.mime_type)) ? 'image' : 'file')
      : 'text';
    
    const userMsg: Message = {
      id: `msg_${conversationId}_${Date.now()}_user`,
      conversationId,
      sender: "user",
      text: inputValue,
      createdAt: new Date().toISOString(),
      replyTo: currentReply,
      contentType,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    };
    
    addMessage(userMsg);
    saveMessage(userMsg);
    
    const userText = inputValue;
    setInputValue("");
    setReplyingTo(null);
    setSelectedFiles([]);
    setUploadedAttachments([]);
    setUploadProgress(new Map());

    setIsTyping(true);

    try {
      let promptWithFiles = userText;
      if (currentAttachments.length > 0) {
        const fileList = currentAttachments.map(att => `- ${att.name} (${att.mime_type})`).join('\n');
        promptWithFiles = `${userText}\n\n[User đã gửi ${currentAttachments.length} file(s):\n${fileList}]`;
      }
      
      const res = await apiChat({ prompt: promptWithFiles, system_instruction: "Bạn là trợ lý kho N3T, trả lời ngắn gọn." });
      const botMsg: Message = {
        id: `msg_${conversationId}_${Date.now()}_bot`,
        conversationId,
        sender: "bot",
        text: res.reply,
        createdAt: new Date().toISOString(),
      };
      
      // Lưu vào store (UI sẽ tự động cập nhật)
      addMessage(botMsg);
      
      // Sync lên server
      saveMessage(botMsg);
    } catch (e: any) {
      // Xử lý lỗi với thông báo thân thiện hơn
      let errorText = `❌ Lỗi: ${e?.message ?? String(e)}`;
      
      // Nếu là lỗi quota (429), hiển thị thông báo đặc biệt
      if (e?.status === 429) {
        errorText = e?.message || errorText;
      }
      
      const errMsg: Message = {
        id: `msg_${conversationId}_${Date.now()}_error`,
        conversationId,
        sender: "bot",
        text: errorText,
        createdAt: new Date().toISOString(),
      };
      
      // Lưu vào store (UI sẽ tự động cập nhật)
      addMessage(errMsg);
    } finally {
      // Ẩn typing indicator khi đã nhận được phản hồi
      setIsTyping(false);
    }
  };

  const getTime = (d: string) =>
    new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <ChatBackground className="flex flex-col h-full w-full">
      {/* Header */}
      <div className={`relative z-10 flex justify-between items-center gap-3 px-6 py-4 border-b shrink-0 ${
        isDarkMode 
          ? "bg-zinc-900/70 backdrop-blur-md border-white/10" 
          : "bg-white/70 backdrop-blur-md border-black/10"
      }`}>
        <div className="flex items-center gap-2">
          {sidebarCollapsed && onExpandSidebar && (
            <button
              onClick={onExpandSidebar}
              className={`rounded-full w-8 h-8 flex items-center justify-center transition-all duration-150 hover:scale-105 ${
                isDarkMode
                  ? "bg-zinc-800/80 text-white hover:bg-zinc-700"
                  : "bg-white/80 text-gray-800 hover:bg-gray-100"
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

      {/* Chat messages area */}
      <div ref={messagesContainerRef} className="relative z-10 flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 space-y-2 min-h-full">
        {messages.length === 0 && (
          <div className="flex flex-col items-start justify-center h-full text-left p-6">
            <div className={`text-sm mb-4 ${isDarkMode ? "text-zinc-400" : "text-zinc-600"}`}>
              Xin chào! Tôi có thể giúp gì cho bạn?
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setInputValue(`Tôi cần trợ giúp về ${cat.label.toLowerCase()}`);
                    setShowCategories(false);
                  }}
                  className={`px-4 py-3 rounded-lg border transition backdrop-blur-sm ${
                    isDarkMode
                      ? "bg-zinc-800/80 border-zinc-700 hover:bg-zinc-700 text-white"
                      : "bg-white/80 border-zinc-300 hover:bg-zinc-50 text-zinc-900"
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
        
        {/* Render messages theo nhóm ngày */}
        {messagesGroupedByDate.map((group) => (
          <div key={group.dateKey} ref={(el) => { dateRefs.current[group.dateKey] = el; }}>
            {/* Date separator */}
            <DateSeparator 
              date={group.date} 
              onClick={() => setShowDatePicker(true)} 
            />
            
            {/* Messages trong ngày */}
            {group.messages.map((m, index) => {
              const next = group.messages[index + 1];
              const isSameSender = next && next.sender === m.sender;

              const currentTime = getTime(m.createdAt);
              const nextTime = next ? getTime(next.createdAt) : undefined;
              const isSameTime = next && nextTime === currentTime;

              const isLastInGroup = !(isSameSender && isSameTime);

              return (
                <MessageBubble
                  key={m.id}
                  messageId={m.id}
                  text={m.text}
                  time={currentTime}
                  mine={m.sender === "user"}
                  isLastInGroup={isLastInGroup}
                  replyTo={m.replyTo}
                  initialReactions={m.reactions || []}
                  onReactionChange={handleReactionChange}
                  contentType={m.contentType}
                  attachments={m.attachments}
                  onReply={() => {
                    setReplyingTo({
                      id: m.id,
                      text: m.text,
                      sender: m.sender === "user" ? "Bạn" : "Bot"
                    });
                    inputRef.current?.focus();
                  }}
                />
              );
            })}
          </div>
        ))}
        
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Date Picker Modal */}
      <ChatDatePicker
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelectDate={scrollToDate}
        availableDates={availableDates}
      />

      <div className={`relative z-10 flex flex-col border-t shrink-0 ${
        isDarkMode
          ? "bg-zinc-900/80 backdrop-blur-md border-white/5"
          : "bg-white/80 backdrop-blur-md border-black/5"
      }`}>
        {/* Reply preview */}
        {replyingTo && (
          <div className={`flex items-center gap-2 px-4 py-2 border-b ${
            isDarkMode ? "border-white/10 bg-zinc-800/50" : "border-black/10 bg-blue-50"
          }`}>
            <div className={`flex-1 pl-3 border-l-4 border-blue-500 min-w-0 ${
              isDarkMode ? "text-zinc-300" : "text-gray-700"
            }`}>
              <span className={`text-xs font-semibold block mb-0.5 ${
                isDarkMode ? "text-blue-400" : "text-blue-600"
              }`}>Đang trả lời {replyingTo.sender}</span>
              <p className="text-sm line-clamp-2 opacity-80">{replyingTo.text}</p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className={`p-2 rounded-lg transition-all hover:scale-110 flex-shrink-0 ${
                isDarkMode 
                  ? "hover:bg-red-500/20 text-red-400 hover:text-red-300" 
                  : "hover:bg-red-100 text-red-500 hover:text-red-600"
              }`}
              title="Hủy trả lời"
            >
              <Icon name="close" size="md" />
            </button>
          </div>
        )}
        
        {/* Input row */}
        <div className="flex flex-col gap-2">
          {/* Attachment preview */}
          {selectedFiles.length > 0 && (
            <div className="px-4 pt-2">
              <AttachmentPreview
                files={selectedFiles}
                uploadProgress={uploadProgress}
                onRemove={handleRemoveFile}
              />
            </div>
          )}
          
          <div className="flex items-center gap-3 p-4">
            <AttachmentPicker onFilesSelected={handleFilesSelected} />
            <button className={`p-2.5 rounded-full transition-all duration-150 hover:scale-105 ${
              isDarkMode ? "text-zinc-400 hover:bg-zinc-800/50" : "text-gray-600 hover:bg-gray-200/50"
            }`} title="Ghi âm" style={{ display: 'none' }}><Icon name="microphone" size="md" /></button>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              type="text"
              placeholder="Nhập tin nhắn..."
              className={`flex-1 px-4 py-2.5 rounded-[24px] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30 transition-all hover:scale-[1.02] hover:-translate-y-0.5 ${
                isDarkMode
                  ? "bg-zinc-800/80 border border-white/10 text-white placeholder-zinc-500 focus:border-[var(--primary)]/50"
                  : "bg-white/90 border border-black/10 text-gray-900 placeholder-gray-400 focus:border-[var(--primary)]/50"
              }`}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); handleSend();
                }
              }}
            />
            <button 
              className="text-white p-3 rounded-full hover:scale-105 transition-all duration-150 shadow-ios-lg liquid-glass-hover" 
              style={{ backgroundColor: 'var(--primary)' }}
              onClick={handleSend} 
              title="Gửi"
            >
              <Icon name="send" size="md" />
            </button>
          </div>
        </div>
      </div>
    </ChatBackground>
  );
}
