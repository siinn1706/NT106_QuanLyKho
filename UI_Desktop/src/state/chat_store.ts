/** Chat Store - Zustand
 *  - Quản lý lịch sử chat theo conversationId (per-user isolation)
 *  - Persist vào localStorage để giữ lịch sử khi reload
 *  - Hỗ trợ reactions và reply
 *  - Bot conversations use format: bot_{user_id} for isolation
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ContentType, Attachment } from '../types/attachment';

export type ReplyInfo = {
  id: string;
  text: string;
  sender: string;
};

export type MessageReaction = {
  userId: string;
  emoji: string;
  createdAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  sender: "user" | "agent" | "bot";
  text: string;
  createdAt: string;
  replyTo?: ReplyInfo | null;
  reactions?: MessageReaction[];
  contentType?: ContentType;
  attachments?: Attachment[];
};

interface ChatStore {
  // Lưu messages theo conversationId: { [conversationId]: Message[] }
  conversations: Record<string, Message[]>;
  
  // Thêm message vào conversation
  addMessage: (message: Message) => void;
  
  // Cập nhật reactions của một message
  updateMessageReactions: (messageId: string, reactions: MessageReaction[]) => void;
  
  // Toggle reaction for a message (add if not exists, remove if exists)
  toggleMessageReaction: (messageId: string, emoji: string, userId: string) => void;
  
  // Lấy messages của một conversation
  getMessages: (conversationId: string) => Message[];
  
  // Xóa tất cả messages của một conversation
  clearConversation: (conversationId: string) => void;
  
  // Xóa tất cả conversations
  clearAll: () => void;
  
  // Load messages từ server
  loadFromServer: (conversationId: string, messages: Message[]) => void;
  
  // Get bot conversation ID for current user (format: bot_{user_id})
  getBotConversationId: (userId: string) => string;
  
  // Initialize bot conversation with welcome message if not exists
  initBotConversation: (userId: string) => void;
}

const MOCK_INITIAL_MESSAGES: Record<string, Message[]> = {
  // Removed hardcoded "bot" key - will be initialized dynamically per user
  // via initBotConversation(userId) method
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: MOCK_INITIAL_MESSAGES,
      
      addMessage: (message) => {
        set((state) => {
          const conversationId = message.conversationId;
          const existingMessages = state.conversations[conversationId] || [];
          
          // Kiểm tra xem message đã tồn tại chưa (tránh duplicate)
          const isDuplicate = existingMessages.some(m => m.id === message.id);
          if (isDuplicate) {
            return state;
          }
          
          return {
            conversations: {
              ...state.conversations,
              [conversationId]: [...existingMessages, { ...message, reactions: message.reactions || [] }],
            },
          };
        });
      },
      
      updateMessageReactions: (messageId, reactions) => {
        set((state) => {
          const newConversations = { ...state.conversations };
          
          // Tìm message trong tất cả conversations
          for (const convId of Object.keys(newConversations)) {
            const messages = newConversations[convId];
            const msgIndex = messages.findIndex(m => m.id === messageId);
            
            if (msgIndex !== -1) {
              newConversations[convId] = messages.map((m, i) => 
                i === msgIndex ? { ...m, reactions } : m
              );
              break;
            }
          }
          
          return { conversations: newConversations };
        });
      },

      // Toggle reaction for a message (add if not exists, remove if exists)
      toggleMessageReaction: (messageId, emoji, userId) => {
        set((state) => {
          const newConversations = { ...state.conversations };
          
          // Tìm message trong tất cả conversations
          for (const convId of Object.keys(newConversations)) {
            const messages = newConversations[convId];
            const msgIndex = messages.findIndex(m => m.id === messageId);
            
            if (msgIndex !== -1) {
              const message = messages[msgIndex];
              const currentReactions = message.reactions || [];
              
              // Check if user already has this reaction
              const existingIndex = currentReactions.findIndex(
                r => r.userId === userId && r.emoji === emoji
              );
              
              let updatedReactions: MessageReaction[];
              if (existingIndex !== -1) {
                // Remove existing reaction
                updatedReactions = currentReactions.filter((_, i) => i !== existingIndex);
              } else {
                // Add new reaction
                updatedReactions = [
                  ...currentReactions,
                  { userId, emoji, createdAt: new Date().toISOString() }
                ];
              }
              
              newConversations[convId] = messages.map((m, i) => 
                i === msgIndex ? { ...m, reactions: updatedReactions } : m
              );
              break;
            }
          }
          
          return { conversations: newConversations };
        });
      },
      
      getMessages: (conversationId) => {
        const state = get();
        return state.conversations[conversationId] || [];
      },
      
      clearConversation: (conversationId) => {
        set((state) => {
          const newConversations = { ...state.conversations };
          // Clear conversation (no MOCK fallback since we init dynamically)
          delete newConversations[conversationId];
          return { conversations: newConversations };
        });
      },
      
      clearAll: () => {
        set({ conversations: {} });
      },
      
      // Load messages từ server (merge với local, server wins)
      loadFromServer: (conversationId, serverMessages) => {
        set((state) => {
          const localMessages = state.conversations[conversationId] || [];
          
          // Merge: server messages là primary source
          const serverIds = new Set(serverMessages.map(m => m.id));
          const uniqueLocalMsgs = localMessages.filter(m => !serverIds.has(m.id));
          
          // Gộp và sort theo thời gian
          const merged = [...serverMessages, ...uniqueLocalMsgs].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          return {
            conversations: {
              ...state.conversations,
              [conversationId]: merged,
            },
          };
        });
      },
      
      // Get bot conversation ID for current user (format: bot_{user_id})
      getBotConversationId: (userId: string) => {
        return `bot_${userId}`;
      },
      
      // Initialize bot conversation with welcome message if not exists
      initBotConversation: (userId: string) => {
        const conversationId = `bot_${userId}`;
        const state = get();
        
        if (!state.conversations[conversationId] || state.conversations[conversationId].length === 0) {
          const welcomeMessage: Message = {
            id: `${conversationId}_welcome`,
            conversationId,
            sender: "bot",
            text: "Xin chào! Tôi là trợ lý N3T. Tôi có thể giúp gì cho bạn về quản lý kho?",
            createdAt: new Date().toISOString(),
            reactions: [],
          };
          
          set((state) => ({
            conversations: {
              ...state.conversations,
              [conversationId]: [welcomeMessage],
            },
          }));
        }
      },
    }),
    {
      name: 'n3t-chat-storage', // Key trong localStorage
    }
  )
);

