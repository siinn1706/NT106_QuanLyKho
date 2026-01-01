import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useThemeStore } from "../../theme/themeStore";
import { useRTChatStore } from "../../state/rt_chat_store";
import ReactMarkdown from "react-markdown";
import Icon from "../ui/Icon";
import Popover, { PopoverItem, PopoverDivider } from "../ui/Popover";
import ForwardMessageModal from "./ForwardMessageModal";
import type { ContentType, Attachment } from "../../types/attachment";
import { formatFileSize, isImageMimeType } from "../../types/attachment";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import { showToast } from "../../utils/toast";

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
  status,
  contentType = 'text',
  attachments,
  senderName,
  senderAvatar,
  conversationId,
  editedAt,
  deletedAt,
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
  status?: 'pending' | 'sent' | 'delivered' | 'read';
  contentType?: ContentType;
  attachments?: Attachment[];
  senderName?: string;
  senderAvatar?: string;
  conversationId?: string;
  editedAt?: string;
  deletedAt?: string;
}) {
  const [showAction, setShowAction] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPos, setEmojiPickerPos] = useState<{ x: number; y: number } | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(text);
  const [reactions, setReactions] = useState<string[]>(initialReactions);
  const [menuAnchorPos, setMenuAnchorPos] = useState<{ x: number; y: number } | undefined>();
  const isOpeningRef = useRef(false);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const editMessage = useRTChatStore((state) => state.editMessage);
  const deleteMessage = useRTChatStore((state) => state.deleteMessage);
  const hideMessage = useRTChatStore((state) => state.hideMessage);
  const pinMessage = useRTChatStore((state) => state.pinMessage);
  const unpinMessage = useRTChatStore((state) => state.unpinMessage);
  const pinnedMessages = useRTChatStore((state) => 
    conversationId ? state.pinnedMessagesByConv[conversationId] || [] : []
  );
  const isPinned = pinnedMessages.includes(messageId);

  // Sync reactions khi initialReactions thay đổi (từ server)
  // Use useMemo to create stable reference for comparison
  const reactionsKey = useMemo(() => JSON.stringify(initialReactions), [initialReactions.length, initialReactions.join(',')]);
  
  useEffect(() => {
    setReactions(initialReactions);
  }, [reactionsKey]);

  // Close action buttons when menu closes (and not hovering)
  useEffect(() => {
    if (!showActionsMenu && !showEmojiPicker && !isOpeningRef.current) {
      // Small delay to allow user to move mouse
      const timer = setTimeout(() => {
        setShowAction(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showActionsMenu, showEmojiPicker]);

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

  const handleOpenActionsMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[MessageBubble] Opening actions menu for message', messageId);
    const rect = e.currentTarget.getBoundingClientRect();
    // Position menu below and to the left of the button
    const anchorPos = { x: rect.left, y: rect.bottom };
    setMenuAnchorPos(anchorPos);
    
    // Close emoji picker if open
    setShowEmojiPicker(false);
    
    // Set opening guard to prevent useEffect from hiding buttons
    isOpeningRef.current = true;
    
    // Small delay to ensure button click event completes before Popover listens
    setTimeout(() => {
      setShowActionsMenu(true);
      console.log('[MessageBubble] Menu opened with anchor:', anchorPos);
      // Clear opening guard after menu is stable
      setTimeout(() => {
        isOpeningRef.current = false;
      }, 100);
    }, 50);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowActionsMenu(false);
  };

  const handleSaveEdit = () => {
    if (!conversationId) return;
    if (editContent.trim() === text.trim()) {
      setIsEditing(false);
      return;
    }

    editMessage(conversationId, messageId, editContent.trim());
    setIsEditing(false);
    showToast.success('Đã chỉnh sửa tin nhắn');
  };

  const handleCancelEdit = () => {
    setEditContent(text);
    setIsEditing(false);
  };

  const handleDeleteForEveryone = () => {
    if (!conversationId) return;
    if (window.confirm('Bạn có chắc muốn thu hồi tin nhắn này với mọi người?')) {
      deleteMessage(conversationId, messageId, true);
      setShowActionsMenu(false);
      showToast.success('Đã thu hồi tin nhắn');
    }
  };

  const handleDeleteForMe = () => {
    if (!conversationId) return;
    if (window.confirm('Bạn có chắc muốn xoá tin nhắn này chỉ ở phía bạn?')) {
      hideMessage(conversationId, messageId);
      setShowActionsMenu(false);
      showToast.success('Đã xoá tin nhắn');
    }
  };

  const handleForward = () => {
    setShowActionsMenu(false);
    setShowForwardModal(true);
  };
  
  const handlePin = () => {
    if (!conversationId) return;
    pinMessage(conversationId, messageId);
    setShowActionsMenu(false);
    showToast.success('Đã ghim tin nhắn');
  };
  
  const handleUnpin = () => {
    if (!conversationId) return;
    unpinMessage(conversationId, messageId);
    setShowActionsMenu(false);
    showToast.success('Đã bỏ ghim tin nhắn');
  };
  
  // Lấy reaction đầu tiên để hiển thị (hoặc null)
  const displayReaction = reactions.length > 0 ? reactions[reactions.length - 1] : null;

  // If message is deleted, show placeholder
  if (deletedAt) {
    return (
      <div className={`flex flex-col ${mine ? "items-end" : "items-start"} mb-0.5 opacity-60`}>
        <div className={`px-4 py-3 rounded-2xl text-sm max-w-[280px] italic ${
          isDarkMode ? 'bg-zinc-800/50 text-zinc-500' : 'bg-gray-100/50 text-gray-500'
        }`}>
          Tin nhắn đã bị thu hồi
        </div>
        {isLastInGroup && (
          <span className={`text-xs mt-1 ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
            {time}
          </span>
        )}
      </div>
    );
  }
  
  return (
    <div 
      className={`flex flex-col ${mine ? "items-end" : "items-start"} mb-0.5`}
      onMouseEnter={() => setShowAction(true)} 
      onMouseLeave={() => { 
        // Don't hide actions if menu is open
        if (!showActionsMenu) {
          setShowAction(false);
        }
        setShowEmojiPicker(false);
      }}
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
            {/* Attachments first */}
            {attachments && attachments.length > 0 && (
              <div className="mb-2">
                {contentType === 'image' ? (
                  <ImageAttachments attachments={attachments} />
                ) : contentType === 'file' ? (
                  <FileAttachments attachments={attachments} mine={mine} isDarkMode={isDarkMode} />
                ) : null}
              </div>
            )}

            {/* Text content or Edit mode */}
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm resize-none ${
                    isDarkMode
                      ? 'bg-zinc-700 border-zinc-600 text-zinc-100'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  rows={3}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveEdit();
                    }
                    if (e.key === 'Escape') {
                      handleCancelEdit();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    Lưu
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            ) : (
              text && (
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
                  {editedAt && (
                    <span className={`text-xs italic ml-2 ${
                      mine ? 'text-white/70' : isDarkMode ? 'text-zinc-500' : 'text-gray-500'
                    }`}>
                      (đã sửa)
                    </span>
                  )}
                </div>
              )
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
        {showAction && !isEditing && !deletedAt && (
          <div className="flex items-center gap-1 shrink-0 mb-1">
            {/* Thứ tự: more → reply → emoji (giống Messenger) */}
            <button 
              onClick={handleOpenActionsMenu}
              className={`p-1.5 rounded-full border backdrop-blur-md transition-all duration-150 shadow-sm ${
                isDarkMode
                  ? "border-white/20 bg-white/15 text-zinc-300 hover:bg-white/25 hover:text-white"
                  : "border-black/10 bg-black/5 text-zinc-600 hover:bg-black/10 hover:text-zinc-900"
              }`}
              title="Thêm"
            >
              <Icon name="ellipsis-v" size="sm" />
            </button>
            {onReply && (
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
            )}
            <button 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const gap = 12;
                setEmojiPickerPos({
                  x: rect.left + rect.width / 2,
                  y: rect.top - gap
                });
                // Close actions menu if open
                setShowActionsMenu(false);
                setShowEmojiPicker(!showEmojiPicker);
              }}
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

        {/* Actions menu popover */}
        <Popover
          isOpen={showActionsMenu}
          onClose={() => setShowActionsMenu(false)}
          anchorPosition={menuAnchorPos}
          placement={mine ? 'bottom-right' : 'bottom-left'}
          isDarkMode={isDarkMode}
        >
          {mine && (
            <>
              <PopoverItem
                label="Chỉnh sửa"
                onClick={handleEdit}
                isDarkMode={isDarkMode}
              />
              <PopoverDivider isDarkMode={isDarkMode} />
            </>
          )}
          <PopoverItem
            label="Chuyển tiếp"
            onClick={handleForward}
            isDarkMode={isDarkMode}
          />
          <PopoverItem
            label={isPinned ? "Bỏ ghim" : "Ghim"}
            onClick={isPinned ? handleUnpin : handlePin}
            isDarkMode={isDarkMode}
          />
          {mine && (
            <>
              <PopoverDivider isDarkMode={isDarkMode} />
              <PopoverItem
                label="Thu hồi"
                onClick={handleDeleteForEveryone}
                variant="danger"
                isDarkMode={isDarkMode}
              />
            </>
          )}
          <PopoverItem
            label="Xoá ở tôi"
            onClick={handleDeleteForMe}
            variant="danger"
            isDarkMode={isDarkMode}
          />
        </Popover>
      </div>

      {/* Hàng dưới: thời gian, nằm trái/phải theo phía, chỉ cho tin cuối nhóm */}
      {isLastInGroup && (
        <div className={`flex items-center gap-1.5 mt-1 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className={`text-xs ${isDarkMode ? "text-zinc-300" : "text-zinc-600"}`}>
            {time}
          </span>
          {mine && status && (
            <span className={`text-xs ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
              {status === 'pending' && 'Đang gửi'}
              {status === 'sent' && 'Đã gửi'}
              {status === 'delivered' && 'Đã nhận'}
              {status === 'read' && 'Đã xem'}
            </span>
          )}
        </div>
      )}

      {/* Forward message modal */}
      {conversationId && (
        <ForwardMessageModal
          isOpen={showForwardModal}
          onClose={() => setShowForwardModal(false)}
          messageContent={text}
          messageContentType={contentType}
          messageAttachments={attachments}
        />
      )}

      {/* Emoji picker popup - Liquid Glass - Portal */}
      {showEmojiPicker && emojiPickerPos && createPortal(
        <div 
          className="fixed z-[9999] flex items-center gap-0.5 px-1.5 py-1 rounded-full border backdrop-blur-xl backdrop-saturate-150 shadow-lg transition-all duration-200 animate-fadeIn"
          style={{
            right: `${Math.max(12, window.innerWidth - emojiPickerPos.x)}px`,
            top: `${Math.max(12, emojiPickerPos.y)}px`,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.15)'
          }}
        >
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
        </div>,
        document.body
      )}
    </div>
  );
}

interface ImageAttachmentsProps {
  attachments: Attachment[];
}

const ImageAttachments: React.FC<ImageAttachmentsProps> = ({ attachments }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <>
      <div className={`grid gap-1 ${
        attachments.length === 1 ? 'grid-cols-1' : 
        attachments.length === 2 ? 'grid-cols-2' : 
        'grid-cols-2'
      }`}>
        {attachments.map((attachment, idx) => {
          const imageUrl = resolveMediaUrl(attachment.url) || attachment.url;
          return (
            <img
              key={attachment.file_id || idx}
              src={imageUrl}
              alt={attachment.name}
              className="w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedImage(imageUrl)}
            />
          );
        })}
      </div>

      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
};

interface FileAttachmentsProps {
  attachments: Attachment[];
  mine?: boolean;
  isDarkMode: boolean;
}

const FileAttachments: React.FC<FileAttachmentsProps> = ({ attachments, mine, isDarkMode }) => {
  return (
    <div className="flex flex-col gap-2">
      {attachments.map((attachment, idx) => {
        const fileUrl = resolveMediaUrl(attachment.url) || attachment.url;
        return (
          <a
            key={attachment.file_id || idx}
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
              mine 
                ? "bg-white/10 hover:bg-white/20" 
                : isDarkMode
                  ? "bg-zinc-700 hover:bg-zinc-600"
                  : "bg-white hover:bg-gray-50"
            }`}
          >
            <FileIconSmall ext={attachment.name.split('.').pop()?.toLowerCase() || ''} />
            <div className="flex-1 min-w-0">
              <div className={`text-xs truncate ${mine ? "text-white" : isDarkMode ? "text-zinc-100" : "text-gray-900"}`}>
                {attachment.name}
              </div>
              <div className={`text-xs ${mine ? "text-white/70" : isDarkMode ? "text-zinc-400" : "text-gray-500"}`}>
                {formatFileSize(attachment.size)}
              </div>
            </div>
            <svg className={`w-4 h-4 flex-shrink-0 ${mine ? "text-white/70" : isDarkMode ? "text-zinc-400" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </a>
        );
      })}
    </div>
  );
};

const FileIconSmall: React.FC<{ ext: string }> = ({ ext }) => {
  const getIconColor = () => {
    switch (ext) {
      case 'pdf': return 'text-red-500';
      case 'doc':
      case 'docx': return 'text-blue-500';
      case 'xls':
      case 'xlsx': return 'text-green-500';
      case 'txt': return 'text-gray-500';
      case 'zip':
      case 'rar': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`flex-shrink-0 ${getIconColor()}`}>
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    </div>
  );
};
