import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ChatBackground from "./ChatBackground";
import DateSeparator from "./DateSeparator";
import ChatDatePicker from "./ChatDatePicker";
import { useThemeStore } from "../../theme/themeStore";
import { useChatStore, Message, Attachment } from "../../state/chat_store";
import { useChatSync } from "../../hooks/useChatSync";
import { apiChat } from "../../app/api_client";
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

// Type cho file attachment
interface FileAttachment {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
  thumbnailUrl?: string;
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
  
  // File upload states
  const [selectedFiles, setSelectedFiles] = useState<FileAttachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Category icons mapping
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
    scrollToBottom();
  }, [messages, conversationId]);

  const handleReactionChange = (messageId: string, reactions: string[]) => {
    updateMessageReactions(messageId, reactions);
    saveReactions(messageId, reactions);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (type: string): string => {
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'music';
    if (type.includes('pdf')) return 'file-pdf';
    if (type.includes('word')) return 'file-word';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'file-excel';
    return 'file';
  };

  // Xử lý chọn file
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    const newFiles: FileAttachment[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = `file_${Date.now()}_${i}`;
        
        // Initialize upload progress
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        // Upload file to backend
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conversationId', conversationId);

        try {
          // TODO: Replace with your actual API endpoint
          // Example API call:
          // const response = await fetch('/api/upload', {
          //   method: 'POST',
          //   body: formData,
          // });
          // const data = await response.json();
          
          // Simulate upload for demo (remove this in production)
          await new Promise(resolve => {
            let progress = 0;
            const interval = setInterval(() => {
              progress += 20;
              setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
              if (progress >= 100) {
                clearInterval(interval);
                resolve(true);
              }
            }, 200);
          });

          // Create file attachment object
          const attachment: FileAttachment = {
            id: fileId,
            url: URL.createObjectURL(file), // Replace with server URL in production
            name: file.name,
            type: file.type,
            size: file.size,
            thumbnailUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
          };

          newFiles.push(attachment);
        } catch (uploadError) {
          console.error(`Error uploading file ${file.name}:`, uploadError);
          alert(`Lỗi khi tải file "${file.name}". Vui lòng thử lại.`);
        }
      }

      setSelectedFiles(prev => [...prev, ...newFiles]);
    } catch (error) {
      console.error('File upload error:', error);
      alert('Lỗi khi tải file lên. Vui lòng thử lại.');
    } finally {
      setUploadingFiles(false);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Xóa file khỏi danh sách
  const handleRemoveFile = (fileId: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSend = async () => {
    if (!inputValue.trim() && selectedFiles.length === 0) return;
    
    const currentReply = replyingTo ? { ...replyingTo } : null;
    const currentFiles = [...selectedFiles];
    
    // Tạo user message với attachments
    const userMsg: Message = {
      id: `msg_${conversationId}_${Date.now()}_user`,
      conversationId,
      sender: "user",
      text: inputValue || (selectedFiles.length > 0 ? `📎 ${selectedFiles.length} file đính kèm` : ''),
      createdAt: new Date().toISOString(),
      replyTo: currentReply,
      attachments: currentFiles.length > 0 ? currentFiles.map(f => ({
        file_name: f.name,
        file_type: f.type,
        file_url: f.url,
        file_size: f.size,
      })) : undefined,
    };
    
    addMessage(userMsg);
    saveMessage(userMsg);
    
    const userText = inputValue;
    setInputValue("");
    setReplyingTo(null);
    setSelectedFiles([]); // Clear files after send

    setIsTyping(true);

    try {
      // Nếu có file đính kèm, gửi thông tin file cùng với prompt
      const prompt = currentFiles.length > 0 
        ? `${userText}\n\n[Files attached: ${currentFiles.map(f => f.name).join(', ')}]`
        : userText;
        
      const res = await apiChat({ 
        prompt, 
        system_instruction: "Bạn là trợ lý kho N3T, trả lời ngắn gọn." 
      });
      
      const botMsg: Message = {
        id: `msg_${conversationId}_${Date.now()}_bot`,
        conversationId,
        sender: "bot",
        text: res.reply,
        createdAt: new Date().toISOString(),
      };
      
      addMessage(botMsg);
      saveMessage(botMsg);
    } catch (e: any) {
      let errorText = `❌ Lỗi: ${e?.message ?? String(e)}`;
      
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
      
      addMessage(errMsg);
    } finally {
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
            <DateSeparator 
              date={group.date} 
              onClick={() => setShowDatePicker(true)} 
            />
            
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

      {/* Input Area */}
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
        
        {/* File Preview Area */}
        {selectedFiles.length > 0 && (
          <div className={`px-4 py-3 border-b ${
            isDarkMode ? "border-white/10 bg-zinc-800/30" : "border-black/10 bg-gray-50"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon name="paperclip" size="sm" className={isDarkMode ? "text-zinc-400" : "text-gray-500"} />
              <span className={`text-xs font-medium ${isDarkMode ? "text-zinc-400" : "text-gray-600"}`}>
                {selectedFiles.length} file đính kèm
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file) => (
                <div
                  key={file.id}
                  className={`relative group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    isDarkMode
                      ? "bg-zinc-800/80 border-zinc-700 hover:border-zinc-600"
                      : "bg-white border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {/* Thumbnail or Icon */}
                  <div className="flex-shrink-0">
                    {file.thumbnailUrl ? (
                      <img
                        src={file.thumbnailUrl}
                        alt={file.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded flex items-center justify-center ${
                        isDarkMode ? "bg-zinc-700" : "bg-gray-200"
                      }`}>
                        <Icon name={getFileIcon(file.type)} size="md" className="text-primary" />
                      </div>
                    )}
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate max-w-[150px] ${
                      isDarkMode ? "text-zinc-200" : "text-gray-800"
                    }`}>
                      {file.name}
                    </p>
                    <p className={`text-xs ${
                      isDarkMode ? "text-zinc-500" : "text-gray-500"
                    }`}>
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveFile(file.id)}
                    className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 ${
                      isDarkMode
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                    title="Xóa file"
                  >
                    <Icon name="times" size="xs" />
                  </button>
                  
                  {/* Upload Progress Overlay */}
                  {uploadProgress[file.id] !== undefined && uploadProgress[file.id] < 100 && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {uploadProgress[file.id]}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Input row */}
        <div className="flex items-center gap-3 p-4">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* File attach button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFiles}
            className={`p-2.5 rounded-full transition-all duration-150 hover:scale-105 ${
              uploadingFiles
                ? isDarkMode ? "text-zinc-600 cursor-not-allowed" : "text-gray-400 cursor-not-allowed"
                : isDarkMode ? "text-zinc-400 hover:bg-zinc-800/50" : "text-gray-600 hover:bg-gray-200/50"
            }`} 
            title="Đính kèm file"
          >
            {uploadingFiles ? (
              <div className="animate-spin">
                <Icon name="spinner" size="md" />
              </div>
            ) : (
              <Icon name="paperclip" size="md" />
            )}
          </button>
          
          {/* Voice record button */}
          <button 
            className={`p-2.5 rounded-full transition-all duration-150 hover:scale-105 ${
              isDarkMode ? "text-zinc-400 hover:bg-zinc-800/50" : "text-gray-600 hover:bg-gray-200/50"
            }`} 
            title="Ghi âm"
          >
            <Icon name="microphone" size="md" />
          </button>
          
          {/* Text input */}
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            type="text"
            placeholder={selectedFiles.length > 0 ? "Thêm chú thích (không bắt buộc)..." : "Nhập tin nhắn..."}
            className={`flex-1 px-4 py-2.5 rounded-[24px] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30 transition-all hover:scale-[1.02] hover:-translate-y-0.5 ${
              isDarkMode
                ? "bg-zinc-800/80 border border-white/10 text-white placeholder-zinc-500 focus:border-[var(--primary)]/50"
                : "bg-white/90 border border-black/10 text-gray-900 placeholder-gray-400 focus:border-[var(--primary)]/50"
            }`}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); 
                handleSend();
              }
            }}
          />
          
          {/* Send button */}
          <button 
            className="text-white p-3 rounded-full hover:scale-105 transition-all duration-150 shadow-ios-lg liquid-glass-hover disabled:opacity-50 disabled:cursor-not-allowed" 
            style={{ backgroundColor: 'var(--primary)' }}
            onClick={handleSend}
            disabled={uploadingFiles || (!inputValue.trim() && selectedFiles.length === 0)}
            title="Gửi"
          >
            <Icon name="send" size="md" />
          </button>
        </div>
      </div>
    </ChatBackground>
  );
}