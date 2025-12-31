import { useState, useEffect, useMemo } from "react";
import { useThemeStore } from "../../theme/themeStore";
import ReactMarkdown from "react-markdown";
import Icon from "../ui/Icon";

// Emoji reactions giống Messenger/Telegram
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

interface ReplyInfo {
  text: string;
  sender: string;
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
}: {
  messageId: string;
  text: string;
  mine?: boolean;
  time: string;
  isLastInGroup?: boolean;
  replyTo?: ReplyInfo | null;
  onReply?: () => void;
  initialReactions?: string[]; // Reactions từ server/store
  onReactionChange?: (messageId: string, reactions: string[]) => void; // Callback khi reactions thay đổi
}) {
  const [showAction, setShowAction] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactions, setReactions] = useState<string[]>(initialReactions);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  // Sync reactions khi initialReactions thay đổi (từ server)
  // Use useMemo to create stable reference for comparison
  const reactionsKey = useMemo(() => JSON.stringify(initialReactions), [initialReactions.length, initialReactions.join(',')]);
  
  useEffect(() => {
    setReactions(initialReactions);
  }, [reactionsKey]);

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
                      isDarkMode ? "bg-zinc-700" : "bg-zinc-300"
                    }`}>{children}</code>
                  ),
                  pre: ({ children }) => (
                    <pre className={`p-2 rounded my-2 overflow-x-auto ${
                      isDarkMode ? "bg-zinc-700" : "bg-zinc-300"
                    }`}>{children}</pre>
                  ),
                  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                }}
              >
                {text}
              </ReactMarkdown>
            </div>
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
    </div>
  );
}
