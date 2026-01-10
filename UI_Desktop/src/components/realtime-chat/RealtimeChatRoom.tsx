// src/components/realtime-chat/RealtimeChatRoom.tsx
/**
 * Chat room for realtime user-to-user chat.
 * Similar to ChatRoom but uses rt_chat_store instead of chat_store.
 */

import { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from "react";
import { useThemeStore } from "../../theme/themeStore";
import { useRTChatStore, MessageUI } from "../../state/rt_chat_store";
import { useAuthStore } from "../../state/auth_store";
import { rtWSClient } from "../../services/rt_ws_client";
import { AttachmentPicker, AttachmentPreview } from "../chat/AttachmentPicker";
import { isImageMimeType, type Attachment, type UploadProgress } from "../../types/attachment";
import { showError } from "../../utils/toast";
import { isNearBottom } from "../../utils/chatHelpers";
import ChatBackground from "../chat/ChatBackground";
import DateSeparator from "../chat/DateSeparator";
import ChatDatePicker from "../chat/ChatDatePicker";
import MessageBubble from "../chat/MessageBubble";
import TypingIndicator from "../chat/TypingIndicator";
import PinnedMessageBar from "./PinnedMessageBar";
import PinnedMessagesListModal from "./PinnedMessagesListModal";
import Icon from "../ui/Icon";
import { resolveMediaUrl, getInitials } from "../../utils/mediaUrl";

function getDateKey(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseLocalDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function RealtimeChatRoom({ conversationId, sidebarCollapsed, onExpandSidebar }: {
  conversationId: string;
  sidebarCollapsed?: boolean;
  onExpandSidebar?: () => void;
}) {
  const currentUser = useAuthStore(state => state.user);
  const messages = useRTChatStore(state => state.messagesByConv[conversationId] || []);
  const conversation = useRTChatStore(state => state.conversations.find(c => c.id === conversationId));
  const typing = useRTChatStore(state => state.typingByConv[conversationId] || {});
  const sendMessage = useRTChatStore(state => state.sendMessage);
  const markRead = useRTChatStore(state => state.markRead);
  const uploadFile = useRTChatStore(state => state.uploadFile);
  const toggleReaction = useRTChatStore(state => state.toggleReaction);
  
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());
  const [uploadedAttachments, setUploadedAttachments] = useState<Attachment[]>([]);
  const [replyingTo, setReplyingTo] = useState<MessageUI | null>(null);
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [showPinnedList, setShowPinnedList] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const dateRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const typingTimeoutRef = useRef<number | null>(null);
  const prevConversationIdRef = useRef<string | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);
  const isDarkMode = useThemeStore(state => state.isDarkMode);
  
  const messagesGroupedByDate = useMemo(() => {
    const groups: { dateKey: string; date: Date; messages: MessageUI[] }[] = [];
    
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
  
  // Helper: Lookup reply info for a message
  const getReplyInfo = (msg: MessageUI): { text: string; sender: string } | null => {
    if (!msg.replyToId) return null;
    
    const repliedMsg = messages.find(m => m.id === msg.replyToId);
    if (!repliedMsg) return null;
    
    return {
      text: repliedMsg.content,
      sender: repliedMsg.senderId === currentUser?.id 
        ? 'Bạn' 
        : (repliedMsg.senderDisplayName || repliedMsg.senderEmail || 'User')
    };
  };
  
  const availableDates = useMemo(() => {
    return messagesGroupedByDate.map(g => g.date);
  }, [messagesGroupedByDate]);
  
  const scrollToDate = useCallback((date: Date) => {
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const el = dateRefs.current[dateKey];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShowDatePicker(false);
    }
  }, []);
  
  useLayoutEffect(() => {
    if (conversationId !== prevConversationIdRef.current) {
      prevConversationIdRef.current = conversationId;
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        setIsUserNearBottom(true);
      });
    }
  }, [conversationId]);
  
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    const isOwnMessage = lastMessage?.senderId === currentUser?.id;
    
    if (isOwnMessage || isUserNearBottom) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    } else {
      setShowScrollButton(true);
    }
  }, [messages.length, currentUser?.id]);
  
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      const nearBottom = isNearBottom(container, 60);
      setIsUserNearBottom(nearBottom);
      setShowScrollButton(!nearBottom);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsUserNearBottom(true);
  }, []);
  
  useEffect(() => {
    if (messages.length > 0 && currentUser) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.senderId !== currentUser.id) {
        markRead(conversationId, lastMsg.id);
      }
    }
  }, [messages, conversationId, currentUser, markRead]);
  
  const handleFilesSelected = async (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
    
    for (const file of files) {
      setUploadProgress(prev => {
        const progressMap = new Map(prev);
        progressMap.set(file.name, { file, progress: 0, status: 'uploading' });
        return progressMap;
      });
      
      try {
        const result = await uploadFile(file);
        
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
  
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() && uploadedAttachments.length === 0) return;
    
    const currentAttachments = [...uploadedAttachments];
    const contentType = currentAttachments.length > 0
      ? (currentAttachments.every(att => isImageMimeType(att.mime_type)) ? 'image' : 'file')
      : 'text';
    
    // Send message with replyToId if replying
    sendMessage(
      conversationId, 
      inputValue.trim(), 
      contentType as any, 
      currentAttachments.length > 0 ? currentAttachments : undefined,
      replyingTo?.id // Pass replyToId
    );
    
    setInputValue("");
    setSelectedFiles([]);
    setUploadedAttachments([]);
    setUploadProgress(new Map());
    setReplyingTo(null);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    rtWSClient.send({
      type: 'typing',
      reqId: '',
      data: { conversationId, isTyping: false }
    });
    setIsTyping(false);
    
    inputRef.current?.focus();
  };

  const handleReply = (message: MessageUI) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };
  
  const handleScrollToPinnedMessage = (messageId: string) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      setHighlightedMessageId(messageId);
      
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      
      highlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightedMessageId(null);
        highlightTimeoutRef.current = null;
      }, 2000);
    } else {
      showError('Tin nhắn đã ghim không có trong lịch sử hiện tại');
    }
  };
  
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      rtWSClient.send({
        type: 'typing',
        reqId: '',
        data: { conversationId, isTyping: true }
      });
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = window.setTimeout(() => {
      setIsTyping(false);
      rtWSClient.send({
        type: 'typing',
        reqId: '',
        data: { conversationId, isTyping: false }
      });
    }, 1000);
  };
  
  const otherMember = conversation?.members.find(m => m.userId !== currentUser?.id);
  const isOtherTyping = otherMember && typing[otherMember.userId];
  const otherAvatarUrl = resolveMediaUrl(otherMember?.userAvatarUrl);
  const otherName = otherMember?.userDisplayName || otherMember?.userEmail || "User";
  
  // Auto-scroll when typing indicator appears if user is near bottom
  useEffect(() => {
    if (isOtherTyping && isUserNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOtherTyping, isUserNearBottom]);
  
  return (
    <ChatBackground className="flex-1 flex flex-col relative overflow-hidden">
      <div className={`flex items-center gap-3 px-5 py-3 border-b shrink-0 z-20 ${
        isDarkMode ? "bg-zinc-950/50 border-white/10" : "bg-white/45 border-black/10"
      } backdrop-blur-xl backdrop-saturate-150`}>
        {sidebarCollapsed && onExpandSidebar && (
          <button
            onClick={onExpandSidebar}
            className={`rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 hover:scale-105 ${
              isDarkMode
                ? "liquid-glass-ui-dark text-white"
                : "liquid-glass-ui text-gray-700"
            }`}
          >
            <Icon name="bars" size="lg" />
          </button>
        )}
        
        {otherAvatarUrl ? (
          <img
            src={otherAvatarUrl}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold"
          style={{ display: otherAvatarUrl ? 'none' : 'flex' }}
        >
          {getInitials(otherName)}
        </div>
        
        <div className="flex-1">
          <div className="font-semibold">{otherName}</div>
          {isOtherTyping && (
            <div className="text-xs text-blue-500">Đang soạn tin...</div>
          )}
        </div>
      </div>
      
      <PinnedMessageBar 
        conversationId={conversationId} 
        onScrollToMessage={handleScrollToPinnedMessage}
        onOpenPinnedList={() => setShowPinnedList(true)}
      />
      
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-5 z-10 relative">
        {messagesGroupedByDate.map((group) => (
          <div key={group.dateKey} ref={(el) => (dateRefs.current[group.dateKey] = el)}>
            <DateSeparator date={group.date} onClick={() => setShowDatePicker(true)} />
            {group.messages.map((msg, idx) => (
              <div key={msg.id} id={`msg-${msg.id}`}>
                <MessageBubble
                  messageId={msg.id}
                  conversationId={conversationId}
                  text={msg.content}
                  time={new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  mine={msg.senderId === currentUser?.id}
                  isLastInGroup={idx === group.messages.length - 1 || group.messages[idx + 1]?.senderId !== msg.senderId}
                  replyTo={getReplyInfo(msg)}
                  initialReactions={msg.reactions || []}
                  onReactionChange={(messageId, emoji) => toggleReaction(conversationId, messageId, emoji)}
                  onReply={() => handleReply(msg)}
                  status={msg.status}
                  contentType={msg.contentType}
                  attachments={msg.attachments}
                  senderName={msg.senderDisplayName || msg.senderEmail}
                  senderAvatar={msg.senderAvatarUrl}
                  editedAt={msg.editedAt}
                  deletedAt={msg.deletedAt}
                  highlighted={highlightedMessageId === msg.id}
                  onImageClick={setLightboxImage}
                />
              </div>
            ))}
          </div>
        ))}
        
        {isOtherTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
      
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className={`absolute bottom-24 right-8 z-30 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 ${
            isDarkMode
              ? "bg-zinc-800 border border-zinc-700 text-white"
              : "bg-white border border-zinc-300 text-gray-700"
          }`}
          title="Cuộn xuống tin nhắn mới nhất"
        >
          <Icon name="chevron-down" size="md" />
        </button>
      )}
      
      {showDatePicker && (
        <ChatDatePicker
          isOpen={showDatePicker}
          availableDates={availableDates}
          onSelectDate={scrollToDate}
          onClose={() => setShowDatePicker(false)}
        />
      )}
      
      <form
        onSubmit={handleSend}
        className={`flex flex-col gap-2 border-t shrink-0 z-20 ${
          isDarkMode ? "bg-zinc-950/50 border-white/10" : "bg-white/45 border-black/10"
        } backdrop-blur-xl backdrop-saturate-150`}
      >
        {/* Reply preview */}
        {replyingTo && (
          <div className={`mx-4 mt-3 px-4 py-3 rounded-[var(--radius-xl)] border backdrop-blur-sm flex items-start gap-3 ${
            isDarkMode
              ? 'border-white/20 bg-white/10'
              : 'border-black/10 bg-black/5'
          }`}>
            <Icon name="reply" size="sm" className={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} />
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-medium mb-1 ${
                isDarkMode ? 'text-zinc-300' : 'text-zinc-600'
              }`}>
                Trả lời {replyingTo.senderId === currentUser?.id ? 'chính mình' : (replyingTo.senderDisplayName || replyingTo.senderEmail || 'User')}
              </div>
              <div className={`text-sm line-clamp-2 ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-700'
              }`}>
                {replyingTo.content}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancelReply}
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                isDarkMode
                  ? 'hover:bg-white/10'
                  : 'hover:bg-black/5'
              }`}
            >
              <Icon name="close" size="xs" />
            </button>
          </div>
        )}
        
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
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Nhập tin nhắn..."
            className={`flex-1 px-4 py-2.5 rounded-full outline-none transition-all duration-200 ${
              isDarkMode
                ? "bg-zinc-700 text-zinc-100 placeholder-zinc-400 border border-zinc-600"
                : "liquid-glass-ui text-gray-800 placeholder-zinc-400"
            }`}
          />
          <button
            type="submit"
            className={`p-3 rounded-full transition-all duration-200 hover:scale-105 shadow-lg ${
              isDarkMode
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "liquid-glass-ui-primary text-white"
            }`}
            disabled={!inputValue.trim() && uploadedAttachments.length === 0}
          >
            <Icon name="send" size="md" />
          </button>
        </div>
      </form>
      
      {/* Pinned Messages List Modal */}
      {showPinnedList && (
        <PinnedMessagesListModal
          conversationId={conversationId}
          onClose={() => setShowPinnedList(false)}
          onScrollToMessage={handleScrollToPinnedMessage}
        />
      )}
      
      {/* Image Lightbox - rendered at ChatRoom level to be above all chat UI */}
      {lightboxImage && (
        <div 
          className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-[100]"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-w-full max-h-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </ChatBackground>
  );
}
