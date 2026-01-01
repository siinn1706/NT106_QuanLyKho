/** Chat Store - Zustand
 *  - Quản lý lịch sử chat theo conversationId
 *  - Persist vào localStorage để giữ lịch sử khi reload
 *  - Hỗ trợ reactions và reply
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ContentType, Attachment } from '../types/attachment';

export type ReplyInfo = {
  id: string;
  text: string;
  sender: string;
};

export type Message = {
  id: string;
  conversationId: string;
  sender: "user" | "agent" | "bot";
  text: string;
  createdAt: string;
  replyTo?: ReplyInfo | null;
  reactions?: string[];
  contentType?: ContentType;
  attachments?: Attachment[];
};

interface ChatStore {
  // Lưu messages theo conversationId: { [conversationId]: Message[] }
  conversations: Record<string, Message[]>;
  
  // Thêm message vào conversation
  addMessage: (message: Message) => void;
  
  // Cập nhật reactions của một message
  updateMessageReactions: (messageId: string, reactions: string[]) => void;
  
  // Lấy messages của một conversation
  getMessages: (conversationId: string) => Message[];
  
  // Xóa tất cả messages của một conversation
  clearConversation: (conversationId: string) => void;
  
  // Xóa tất cả conversations
  clearAll: () => void;
  
  // Load messages từ server
  loadFromServer: (conversationId: string, messages: Message[]) => void;
}

const MOCK_INITIAL_MESSAGES: Record<string, Message[]> = {
  bot: [
    { 
      id: "m1", 
      conversationId: "bot", 
      sender: "bot", 
      text: "Xin chào! Tôi là trợ lý N3T. Tôi có thể giúp gì cho bạn về quản lý kho?", 
      createdAt: new Date().toISOString(),
      reactions: [],
    },
  ],
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
      
      getMessages: (conversationId) => {
        const state = get();
        return state.conversations[conversationId] || [];
      },
      
      clearConversation: (conversationId) => {
        set((state) => {
          const newConversations = { ...state.conversations };
          // Reset về initial message nếu có
          if (MOCK_INITIAL_MESSAGES[conversationId]) {
            newConversations[conversationId] = MOCK_INITIAL_MESSAGES[conversationId];
          } else {
            delete newConversations[conversationId];
          }
          return { conversations: newConversations };
        });
      },
      
      clearAll: () => {
        set({ conversations: MOCK_INITIAL_MESSAGES });
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
    }),
    {
      name: 'n3t-chat-storage', // Key trong localStorage
    }
  )
);

