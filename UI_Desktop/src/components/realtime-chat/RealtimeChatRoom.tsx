// src/components/realtime-chat/RealtimeChatRoom.tsx
/**
 * Chat room for realtime user-to-user chat.
 * Similar to ChatRoom but uses rt_chat_store instead of chat_store.
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { useThemeStore } from "../../theme/themeStore";
import { useRTChatStore, MessageUI } from "../../state/rt_chat_store";
import { useAuthStore } from "../../state/auth_store";
import { rtWSClient } from "../../services/rt_ws_client";
import ChatBackground from "../chat/ChatBackground";
import DateSeparator from "../chat/DateSeparator";
import MessageBubble from "../chat/MessageBubble";
import TypingIndicator from "../chat/TypingIndicator";
import Icon from "../ui/Icon";

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
  
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
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
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);
  
  useEffect(() => {
    if (messages.length > 0 && currentUser) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.senderId !== currentUser.id) {
        markRead(conversationId, lastMsg.id);
      }
    }
  }, [messages, conversationId, currentUser, markRead]);
  
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    sendMessage(conversationId, inputValue.trim());
    setInputValue("");
    
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
  
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      <ChatBackground />
      
      <div className={`flex items-center gap-3 px-5 py-3 border-b shrink-0 z-20 ${
        isDarkMode ? "bg-zinc-900/80 border-zinc-700" : "bg-white/80 border-zinc-300"
      } backdrop-blur-md`}>
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
        
        {otherMember?.userAvatarUrl ? (
          <img src={otherMember.userAvatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {otherMember?.userDisplayName?.charAt(0).toUpperCase() || "U"}
          </div>
        )}
        
        <div className="flex-1">
          <div className="font-semibold">{otherMember?.userDisplayName || otherMember?.userEmail || "User"}</div>
          {isOtherTyping && (
            <div className="text-xs text-blue-500">Đang soạn tin...</div>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-4 z-10">
        {messagesGroupedByDate.map((group) => (
          <div key={group.dateKey}>
            <DateSeparator date={group.date} />
            {group.messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                messageId={msg.id}
                text={msg.content}
                time={new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                mine={msg.senderId === currentUser?.id}
                isLastInGroup={true}
                replyTo={null}
                initialReactions={[]}
                onReactionChange={() => {}}
                onReply={() => {}}
              />
            ))}
          </div>
        ))}
        
        {isOtherTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form
        onSubmit={handleSend}
        className={`flex items-center gap-3 p-4 border-t shrink-0 z-20 ${
          isDarkMode ? "bg-zinc-900/80 border-zinc-700" : "bg-white/80 border-zinc-300"
        } backdrop-blur-md`}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Nhập tin nhắn..."
          className={`flex-1 px-4 py-2.5 rounded-full outline-none transition-all duration-200 ${
            isDarkMode
              ? "liquid-glass-ui-dark text-white placeholder-zinc-500"
              : "liquid-glass-ui text-gray-800 placeholder-zinc-400"
          }`}
        />
        
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className={`rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 hover:scale-105 ${
            inputValue.trim()
              ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg"
              : isDarkMode
                ? "liquid-glass-ui-dark text-zinc-600"
                : "liquid-glass-ui text-zinc-400"
          }`}
        >
          <Icon name="paper-plane" size="sm" />
        </button>
      </form>
    </div>
  );
}
