/** Chat Store - Zustand
 *  - Quản lý lịch sử chat theo conversationId
 *  - Persist vào localStorage để giữ lịch sử khi reload
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Message = {
  id: string;
  conversationId: string;
  sender: "user" | "agent" | "bot";
  text: string;
  createdAt: string;
};

interface ChatStore {
  // Lưu messages theo conversationId: { [conversationId]: Message[] }
  conversations: Record<string, Message[]>;
  
  // Thêm message vào conversation
  addMessage: (message: Message) => void;
  
  // Lấy messages của một conversation
  getMessages: (conversationId: string) => Message[];
  
  // Xóa tất cả messages của một conversation
  clearConversation: (conversationId: string) => void;
  
  // Xóa tất cả conversations
  clearAll: () => void;
}

const MOCK_INITIAL_MESSAGES: Record<string, Message[]> = {
  bot: [
    { 
      id: "m1", 
      conversationId: "bot", 
      sender: "bot", 
      text: "Xin chào! Tôi là trợ lý N3T. Tôi có thể giúp gì cho bạn về quản lý kho?", 
      createdAt: new Date().toISOString() 
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
              [conversationId]: [...existingMessages, message],
            },
          };
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
    }),
    {
      name: 'n3t-chat-storage', // Key trong localStorage
    }
  )
);

