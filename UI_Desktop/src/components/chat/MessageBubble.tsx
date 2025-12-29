import { useState, useEffect } from "react";
import { useThemeStore } from "../../theme/themeStore";
import ReactMarkdown from "react-markdown";
import Icon from "../ui/Icon";

// Emoji reactions giống Messenger/Telegram
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

interface ReplyInfo {
  text: string;
  sender: string;
}

interface FileAttachment {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
  thumbnailUrl?: string;
}

export default function MessageBubble({
  messageId,
  text,
  mine,
  time,
  isLastInGroup,
  replyTo,
  onReply,
  initialReactions = [],
  onReactionChange,
  attachments = [],
}: {
  messageId: string;
  text: string;
  mine?: boolean;
  time: string;
  isLastInGroup?: boolean;
  replyTo?: ReplyInfo | null;
  onReply?: () => void;
  initialReactions?: string[];
  onReactionChange?: (messageId: string, reactions: string[]) => void;
  attachments?: FileAttachment[];
}) {
  const [showAction, setShowAction] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactions, setReactions] = useState<string[]>(initialReactions);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  // Sync reactions khi initialReactions thay đổi (từ server)
  useEffect(() => {
    setReactions(initialReactions);
  }, [initialReactions]);

  const handleReaction = (emoji: string) => {
    let newReactions: string[];
    
    if (reactions.includes(emoji)) {
      // Remove reaction nếu đã có
      newReactions = reactions.filter(r => r !== emoji);
    } else {
      // Thêm reaction (giữ unique)
      newReactions = [...reactions, emoji];
    }
    
    setReactions(newReactions);
    setShowEmojiPicker(false);
    
    // Callback để sync lên server
    onReactionChange?.(messageId, newReactions);
  };
  
  // Lấy reaction đầu tiên để hiển thị (hoặc null)
  const displayReaction = reactions.length > 0 ? reactions[reactions.length - 1] : null;
  
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

  // Handle image click - open in viewer
  const handleImageClick = (url: string) => {
    setSelectedImage(url);
    setImageViewerOpen(true);
  };

  // Separate images and other files
  const imageAttachments = attachments.filter(f => f.type.startsWith('image/'));
  const fileAttachments = attachments.filter(f => !f.type.startsWith('image/'));
  
  return (
    <div 
      className={`flex flex-col ${mine ? "items-end" : "items-start"} ${displayReaction ? "mb-3" : ""}`}
      onMouseEnter={() => setShowAction(true)} 
      onMouseLeave={() => { setShowAction(false); setShowEmojiPicker(false); }}
    >
      {/* Reply preview - hiện tin nhắn đang reply, style giống Messenger */}
      {replyTo && (
        <div className={`flex items-center gap-1.5 mb-1 text-xs ${
          mine ? "flex-row-reverse" : "flex-row"
        }`}>
          <Icon name="reply" size="xs" className={isDarkMode ? "text-zinc-400" : "text-zinc-500"} />
          <span className={isDarkMode ? "text-zinc-300" : "text-zinc-600"}>
            {mine ? "Bạn" : "Bot"} đã trả lời {replyTo.sender}
          </span>
        </div>
      )}

      {/* Reply content preview - nền liquid glass, max 2 dòng */}
      {replyTo && (
        <div className={`flex mb-1 max-w-[260px] ${mine ? "justify-end" : "justify-start"}`}>
          <div className={`px-3 py-2 rounded-xl border backdrop-blur-sm ${
            isDarkMode 
              ? "border-white/20 bg-white/10" 
              : "border-black/10 bg-black/5"
          }`}>
            <p className={`text-xs line-clamp-2 ${
              isDarkMode ? "text-zinc-200" : "text-zinc-700"
            }`}>{replyTo.text}</p>
          </div>
        </div>
      )}

      {/* Hàng chính: action buttons + bong bóng */}
      <div className={`flex items-end gap-1.5 ${mine ? "flex-row-reverse" : "flex-row"}`}>
        {/* Bong bóng tin nhắn - dùng accent color cho tin của mình */}
        <div className="relative">
          <div 
            className={`px-4 py-3 rounded-2xl text-sm max-w-[280px] transition-all break-words ${
              mine 
                ? "text-white shadow-sm" 
                : isDarkMode
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "bg-gray-100 text-gray-900 shadow-sm"
            }`}
            style={mine ? { backgroundColor: 'var(--primary)' } : undefined}
          >
            {/* Text content */}
            {text && (
              <div className="markdown-content whitespace-pre-wrap">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                    code: ({ children }) => (
                      <code className={`px-1 py-0.5 rounded ${
                        mine ? "bg-white/20" : isDarkMode ? "bg-zinc-700" : "bg-zinc-300"
                      }`}>{children}</code>
                    ),
                    pre: ({ children }) => (
                      <pre className={`p-2 rounded my-2 overflow-x-auto ${
                        mine ? "bg-white/20" : isDarkMode ? "bg-zinc-700" : "bg-zinc-300"
                      }`}>{children}</pre>
                    ),
                    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                  }}
                >
                  {text}
                </ReactMarkdown>
              </div>
            )}

            {/* Image attachments - Grid layout */}
            {imageAttachments.length > 0 && (
              <div className={`${text ? "mt-2" : ""} -mx-1 -mb-1`}>
                <div className={`grid gap-1 ${
                  imageAttachments.length === 1 ? "grid-cols-1" :
                  imageAttachments.length === 2 ? "grid-cols-2" :
                  imageAttachments.length === 3 ? "grid-cols-3" :
                  "grid-cols-2"
                }`}>
                  {imageAttachments.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => handleImageClick(img.url)}
                      className="relative group overflow-hidden rounded-lg aspect-square hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={img.thumbnailUrl || img.url}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <Icon 
                          name="search-plus" 
                          size="lg" 
                          className="opacity-0 group-hover:opacity-100 text-white drop-shadow-lg transition-opacity"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* File attachments - List layout */}
            {fileAttachments.length > 0 && (
              <div className={`space-y-1.5 ${text || imageAttachments.length > 0 ? "mt-2" : ""}`}>
                {fileAttachments.map((file) => (
                  <a
                    key={file.id}
                    href={file.url}
                    download={file.name}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all hover:scale-[1.02] ${
                      mine
                        ? "bg-white/10 border-white/20 hover:bg-white/20"
                        : isDarkMode
                          ? "bg-zinc-700/50 border-zinc-600 hover:bg-zinc-700"
                          : "bg-white border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {/* File Icon */}
                    <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 ${
                      mine
                        ? "bg-white/20"
                        : isDarkMode
                          ? "bg-zinc-600"
                          : "bg-gray-200"
                    }`}>
                      <Icon name={getFileIcon(file.type)} size="md" className={mine ? "text-white" : "text-primary"} />
                    </div>
                    
                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${
                        mine ? "text-white" : isDarkMode ? "text-zinc-100" : "text-gray-900"
                      }`}>
                        {file.name}
                      </p>
                      <p className={`text-xs ${
                        mine ? "text-white/70" : isDarkMode ? "text-zinc-400" : "text-gray-500"
                      }`}>
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    
                    {/* Download Icon */}
                    <Icon 
                      name="download" 
                      size="sm" 
                      className={mine ? "text-white/80" : isDarkMode ? "text-zinc-400" : "text-gray-500"}
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
          
          {/* Reaction badge - liquid glass style */}
          {displayReaction && (
            <button 
              onClick={() => handleReaction(displayReaction)}
              className={`absolute -bottom-3 ${mine ? "left-2" : "right-2"} text-sm px-1.5 py-0.5 rounded-full border backdrop-blur-md shadow-sm transition-transform hover:scale-110 ${
                isDarkMode 
                  ? "border-white/25 bg-white/20" 
                  : "border-black/15 bg-white/80"
              }`}
            >
              {reactions.length > 1 ? `${displayReaction} +${reactions.length - 1}` : displayReaction}
            </button>
          )}
        </div>

        {/* Action buttons - liquid glass style, căn theo bottom của bubble */}
        {showAction && (
          <div className="flex items-center gap-1 shrink-0 mb-1">
            {/* Thứ tự: more → reply → emoji (giống Messenger) */}
            <button 
              className={`p-1.5 rounded-full border backdrop-blur-md transition-all duration-150 shadow-sm ${
                isDarkMode
                  ? "border-white/20 bg-white/15 text-zinc-300 hover:bg-white/25 hover:text-white"
                  : "border-black/10 bg-black/5 text-zinc-600 hover:bg-black/10 hover:text-zinc-900"
              }`}
              title="Thêm"
            >
              <Icon name="ellipsis-v" size="sm" />
            </button>
            <button 
              onClick={onReply}
              className={`p-1.5 rounded-full border backdrop-blur-md transition-all duration-150 shadow-sm ${
                isDarkMode
                  ? "border-white/20 bg-white/15 text-zinc-300 hover:bg-white/25 hover:text-white"
                  : "border-black/10 bg-black/5 text-zinc-600 hover:bg-black/10 hover:text-zinc-900"
              }`}
              title="Trả lời"
            >
              <Icon name="reply" size="sm" />
            </button>
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-1.5 rounded-full border backdrop-blur-md transition-all duration-150 shadow-sm ${
                showEmojiPicker 
                  ? isDarkMode 
                    ? "border-white/30 bg-white/30 text-white"
                    : "border-black/20 bg-black/15 text-zinc-900"
                  : isDarkMode
                    ? "border-white/20 bg-white/15 text-zinc-300 hover:bg-white/25 hover:text-white"
                    : "border-black/10 bg-black/5 text-zinc-600 hover:bg-black/10 hover:text-zinc-900"
              }`}
              title="Bày tỏ cảm xúc"
            >
              <Icon name="smile" size="sm" />
            </button>
          </div>
        )}

        {/* Emoji picker popup - Liquid Glass */}
        {showEmojiPicker && (
          <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-full border border-white/20 bg-white/15 backdrop-blur-xl backdrop-saturate-150 shadow-lg transition-all duration-200 animate-fadeIn">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`text-base p-1 rounded-full transition-all duration-150 hover:scale-110 ${
                  reactions.includes(emoji) ? "bg-white/25 scale-105" : "hover:bg-white/20"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hàng dưới: thời gian, nằm trái/phải theo phía, chỉ cho tin cuối nhóm */}
      {isLastInGroup && (
        <span
          className={`text-xs mt-1 ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}
        >
          {time}
        </span>
      )}

      {/* Image Viewer Modal */}
      {imageViewerOpen && selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setImageViewerOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setImageViewerOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all hover:scale-110 z-10"
              title="Đóng"
            >
              <Icon name="times" size="lg" />
            </button>

            {/* Download button */}
            <a
              href={selectedImage}
              download
              onClick={(e) => e.stopPropagation()}
              className="absolute top-4 right-16 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all hover:scale-110 z-10"
              title="Tải xuống"
            >
              <Icon name="download" size="lg" />
            </a>

            {/* Image */}
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}