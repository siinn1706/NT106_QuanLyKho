// src/state/rt_chat_store.ts
/**
 * Zustand store for realtime user-to-user chat.
 * Separate from chat_store.ts (which is for chatbot).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { rtWSClient } from '../services/rt_ws_client';
import { BASE_URL } from '../app/api_client';
import { useAuthStore } from './auth_store';

export interface MessageReceipt {
  userId: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface MessageUI {
  id: string;
  conversationId: string;
  senderId: string;
  clientMessageId: string;
  content: string;
  contentType: 'text' | 'image' | 'file' | 'system';
  attachments?: any[];
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
  senderEmail?: string;
  senderDisplayName?: string;
  senderAvatarUrl?: string;
  receipts?: MessageReceipt[];
  status?: 'pending' | 'sent' | 'delivered' | 'read';
}

export interface ConversationMember {
  userId: string;
  role: string;
  joinedAt: string;
  isAccepted: boolean;
  userEmail?: string;
  userDisplayName?: string;
  userAvatarUrl?: string;
}

export interface ConversationUI {
  id: string;
  type: 'direct' | 'group' | 'module';
  title?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
  updatedAt: string;
  members: ConversationMember[];
  lastMessage?: any;
  unreadCount: number;
}

export interface PresenceInfo {
  isOnline: boolean;
  lastSeenAt?: string;
}

interface RTChatState {
  wsStatus: 'connecting' | 'open' | 'closed';
  conversations: ConversationUI[];
  pendingConversations: ConversationUI[];  // NEW: spam/pending conversations
  activeConversationId: string | null;
  messagesByConv: Record<string, MessageUI[]>;
  typingByConv: Record<string, Record<string, boolean>>;
  presenceByUser: Record<string, PresenceInfo>;
  lastReadByConv: Record<string, string>;
  lastSyncByConv: Record<string, string>;
  
  setWSStatus: (status: 'connecting' | 'open' | 'closed') => void;
  loadConversations: () => Promise<void>;
  loadPendingConversations: () => Promise<void>;  // NEW
  acceptConversation: (conversationId: string) => Promise<void>;  // NEW  joinConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, content: string, contentType?: MessageUI['contentType'], attachments?: any[]) => void;
  markRead: (conversationId: string, lastReadMessageId: string) => void;
  syncConversation: (conversationId: string, afterMessageId?: string) => void;
  createDirectConversation: (email: string) => Promise<string>;
  uploadFile: (file: File) => Promise<any>;
  
  handleServerHello: (data: any) => void;
  handleMsgAck: (data: any) => void;
  handleMsgNew: (data: any) => void;
  handleMsgDelivered: (data: any) => void;
  handleMsgRead: (data: any) => void;
  handleTyping: (data: any) => void;
  handleConvSyncResult: (data: any) => void;
  handleConvUpsert: (data: any) => void;
  handleError: (data: any) => void;
}

export const useRTChatStore = create<RTChatState>()(
  persist(
    (set, get) => {
      // Setup WS event handlers
      const setupWSHandlers = () => {
        rtWSClient.on('server:hello', (msg) => get().handleServerHello(msg.data));
        rtWSClient.on('msg:ack', (msg) => get().handleMsgAck(msg.data));
        rtWSClient.on('msg:new', (msg) => get().handleMsgNew(msg.data));
        rtWSClient.on('msg:delivered', (msg) => get().handleMsgDelivered(msg.data));
        rtWSClient.on('msg:read', (msg) => get().handleMsgRead(msg.data));
        rtWSClient.on('typing', (msg) => get().handleTyping(msg.data));
        rtWSClient.on('conv:sync:result', (msg) => get().handleConvSyncResult(msg.data));
        rtWSClient.on('conv:upsert', (msg) => get().handleConvUpsert(msg.data));
        rtWSClient.on('error', (msg) => get().handleError(msg.data));
      };
      
      setupWSHandlers();
      
      // Monitor WS status
      const checkWSStatus = () => {
        const status = rtWSClient.getStatus();
        if (status !== get().wsStatus) {
          set({ wsStatus: status });
        }
      };
      
      setInterval(checkWSStatus, 1000);
      
      return {
        wsStatus: 'closed',
        conversations: [],
        pendingConversations: [],
        activeConversationId: null,
        messagesByConv: {},
        typingByConv: {},
        presenceByUser: {},
        lastReadByConv: {},
        lastSyncByConv: {},
        
        setWSStatus: (status) => set({ wsStatus: status }),
        
        loadConversations: async () => {
          /**
           * API: GET /rt/conversations
           * Purpose: Load all ACCEPTED conversations for current user
           * Request (JSON): null
           * Response (JSON) [200]: [{ id, type, title, members, last_message, unread_count }]
           */
          try {
            const token = useAuthStore.getState().token;
            const response = await fetch(`${BASE_URL}/rt/conversations`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (!response.ok) throw new Error('Failed to load conversations');
            
            const data: ConversationUI[] = await response.json();
            set({ conversations: data });
            
            for (const conv of data) {
              get().joinConversation(conv.id);
            }
          } catch (e) {
            console.error('[RT-Chat] Failed to load conversations:', e);
          }
        },

        loadPendingConversations: async () => {
          /**
           * API: GET /rt/conversations/pending
           * Purpose: Load all PENDING/SPAM conversations for current user
           * Request (JSON): null
           * Response (JSON) [200]: [{ id, type, title, members, last_message, unread_count }]
           */
          try {
            const token = useAuthStore.getState().token;
            const response = await fetch(`${BASE_URL}/rt/conversations/pending`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (!response.ok) throw new Error('Failed to load pending conversations');
            
            const data: ConversationUI[] = await response.json();
            set({ pendingConversations: data });
          } catch (e) {
            console.error('[RT-Chat] Failed to load pending conversations:', e);
          }
        },

        acceptConversation: async (conversationId: string) => {
          /**
           * API: POST /rt/conversations/{id}/accept
           * Purpose: Accept pending conversation (move from spam to inbox)
           * Request (JSON): null
           * Response (JSON) [200]: { success: true }
           */
          try {
            const token = useAuthStore.getState().token;
            const response = await fetch(`${BASE_URL}/rt/conversations/${conversationId}/accept`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (!response.ok) throw new Error('Failed to accept conversation');
            
            // Move conversation from pending to accepted list
            const pending = get().pendingConversations;
            const conv = pending.find(c => c.id === conversationId);
            
            if (conv) {
              set({
                pendingConversations: pending.filter(c => c.id !== conversationId),
                conversations: [...get().conversations, conv]
              });
              
              // Join the conversation via WebSocket
              get().joinConversation(conversationId);
            }
          } catch (e) {
            console.error('[RT-Chat] Failed to accept conversation:', e);
          }
        },
        
        joinConversation: (conversationId: string) => {
          rtWSClient.send({
            type: 'conv:join',
            reqId: `join-${Date.now()}`,
            data: { conversationId }
          });
          
          if (!get().messagesByConv[conversationId]) {
            get().syncConversation(conversationId);
          }
        },
        
        sendMessage: (conversationId, content, contentType = 'text', attachments) => {
          const currentUser = useAuthStore.getState().user;
          if (!currentUser) {
            console.error('[RT-Chat] Cannot send message: no current user');
            return;
          }
          
          console.log('[RT-Chat] Sending message to:', conversationId, 'content:', content);
          
          const clientMessageId = `${currentUser.id}-${Date.now()}-${Math.random()}`;
          const createdAtClient = new Date().toISOString();
          
          const optimisticMsg: MessageUI = {
            id: clientMessageId,
            conversationId,
            senderId: currentUser.id,
            clientMessageId,
            content,
            contentType,
            attachments,
            createdAt: createdAtClient,
            senderEmail: currentUser.email,
            senderDisplayName: currentUser.display_name,
            senderAvatarUrl: currentUser.avatar_url,
            status: 'pending'
          };
          
          set((state) => ({
            messagesByConv: {
              ...state.messagesByConv,
              [conversationId]: [
                ...(state.messagesByConv[conversationId] || []),
                optimisticMsg
              ]
            }
          }));
          
          const wsStatus = rtWSClient.getStatus();
          console.log('[RT-Chat] WebSocket status:', wsStatus);
          
          rtWSClient.send({
            type: 'msg:send',
            reqId: clientMessageId,
            data: {
              conversationId,
              clientMessageId,
              content,
              contentType,
              attachments,
              createdAtClient
            }
          });
        },
        
        markRead: (conversationId, lastReadMessageId) => {
          rtWSClient.send({
            type: 'msg:read',
            reqId: `read-${Date.now()}`,
            data: { conversationId, lastReadMessageId }
          });
          
          set((state) => ({
            lastReadByConv: {
              ...state.lastReadByConv,
              [conversationId]: lastReadMessageId
            }
          }));
          
          const updatedConversations = get().conversations.map(conv => {
            if (conv.id === conversationId) {
              return { ...conv, unreadCount: 0 };
            }
            return conv;
          });
          set({ conversations: updatedConversations });
        },
        
        syncConversation: (conversationId, afterMessageId) => {
          /**
           * API: WS conv:sync
           * Purpose: Sync messages for a conversation
           * Request (JSON): { conversationId, afterMessageId?, limit? }
           * Response (JSON): { conversationId, messages: [...], hasMore }
           */
          const reqId = `sync-${conversationId}-${Date.now()}`;
          rtWSClient.send({
            type: 'conv:sync',
            reqId,
            data: {
              conversationId,
              afterMessageId: afterMessageId || get().lastSyncByConv[conversationId],
              limit: 50
            }
          });
        },
        
        createDirectConversation: async (email: string): Promise<string> => {
          /**
           * API: POST /rt/conversations/direct
           * Purpose: Create or get existing direct conversation
           * Request (JSON): { email }
           * Response (JSON) [200]: { conversation_id: "..." }
           */
          const token = useAuthStore.getState().token;
          const response = await fetch(`${BASE_URL}/rt/conversations/direct`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create conversation');
          }
          
          const data = await response.json();
          await get().loadConversations();
          return data.conversation_id;
        },
        
        uploadFile: async (file: File): Promise<any> => {
          /**
           * API: POST /rt/files
           * Purpose: Upload file for chat
           * Request (JSON): multipart/form-data
           * Response (JSON) [200]: { file_id, url, name, size, mime_type }
           */
          const token = useAuthStore.getState().token;
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch(`${BASE_URL}/rt/files`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to upload file');
          }
          
          return await response.json();
        },
        
        handleServerHello: (data) => {
          console.log('[RT-Chat] Server hello:', data);
        },
        
        handleMsgAck: (data) => {
          const { conversationId, clientMessageId, serverMessageId, createdAtServer } = data;
          
          set((state) => {
            const messages = state.messagesByConv[conversationId] || [];
            const updatedMessages = messages.map(msg => {
              if (msg.clientMessageId === clientMessageId) {
                return {
                  ...msg,
                  id: serverMessageId,
                  createdAt: createdAtServer,
                  status: 'sent'
                };
              }
              return msg;
            });
            
            return {
              messagesByConv: {
                ...state.messagesByConv,
                [conversationId]: updatedMessages
              }
            };
          });
        },
        
        handleMsgNew: (data) => {
          const { message } = data;
          const currentUser = useAuthStore.getState().user;
          
          set((state) => {
            const messages = state.messagesByConv[message.conversationId] || [];
            
            if (messages.find(m => m.id === message.id)) {
              return state;
            }
            
            return {
              messagesByConv: {
                ...state.messagesByConv,
                [message.conversationId]: [
                  ...messages,
                  { ...message, status: 'delivered' }
                ]
              }
            };
          });
          
          const updatedConversations = get().conversations.map(conv => {
            if (conv.id === message.conversationId) {
              const isFromOther = message.senderId !== currentUser?.id;
              return {
                ...conv,
                lastMessage: {
                  id: message.id,
                  content: message.content,
                  sender_id: message.senderId,
                  created_at: message.createdAt
                },
                unreadCount: isFromOther ? (conv.unreadCount || 0) + 1 : conv.unreadCount,
                updatedAt: message.createdAt
              };
            }
            return conv;
          });
          set({ conversations: updatedConversations });
        },
        
        handleMsgDelivered: (data) => {
          const { conversationId, messageId, userId, deliveredAt } = data;
          
          set((state) => {
            const messages = state.messagesByConv[conversationId] || [];
            const updatedMessages = messages.map(msg => {
              if (msg.id === messageId) {
                const receipts = msg.receipts || [];
                const updatedReceipts = receipts.map(r => 
                  r.userId === userId ? { ...r, deliveredAt } : r
                );
                
                if (!updatedReceipts.find(r => r.userId === userId)) {
                  updatedReceipts.push({ userId, deliveredAt });
                }
                
                return {
                  ...msg,
                  receipts: updatedReceipts,
                  status: 'delivered'
                };
              }
              return msg;
            });
            
            return {
              messagesByConv: {
                ...state.messagesByConv,
                [conversationId]: updatedMessages
              }
            };
          });
        },
        
        handleMsgRead: (data) => {
          const { conversationId, messageId, userId, readAt } = data;
          
          set((state) => {
            const messages = state.messagesByConv[conversationId] || [];
            const updatedMessages = messages.map(msg => {
              if (msg.id === messageId) {
                const receipts = msg.receipts || [];
                const updatedReceipts = receipts.map(r => 
                  r.userId === userId ? { ...r, readAt } : r
                );
                
                if (!updatedReceipts.find(r => r.userId === userId)) {
                  updatedReceipts.push({ userId, readAt });
                }
                
                return {
                  ...msg,
                  receipts: updatedReceipts,
                  status: 'read'
                };
              }
              return msg;
            });
            
            return {
              messagesByConv: {
                ...state.messagesByConv,
                [conversationId]: updatedMessages
              }
            };
          });
        },
        
        handleTyping: (data) => {
          const { conversationId, userId, isTyping } = data;
          
          set((state) => ({
            typingByConv: {
              ...state.typingByConv,
              [conversationId]: {
                ...(state.typingByConv[conversationId] || {}),
                [userId]: isTyping
              }
            }
          }));
          
          setTimeout(() => {
            set((state) => {
              const typing = { ...(state.typingByConv[conversationId] || {}) };
              delete typing[userId];
              return {
                typingByConv: {
                  ...state.typingByConv,
                  [conversationId]: typing
                }
              };
            });
          }, 3000);
        },
        
        handleConvSyncResult: (data) => {
          const { conversationId, messages, hasMore } = data;
          
          set((state) => {
            const existing = state.messagesByConv[conversationId] || [];
            const merged = [...existing];
            
            for (const msg of messages) {
              if (!merged.find(m => m.id === msg.id)) {
                merged.push(msg);
              }
            }
            
            merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            
            const lastMsg = messages[messages.length - 1];
            const newLastSync = lastMsg ? lastMsg.id : state.lastSyncByConv[conversationId];
            
            return {
              messagesByConv: {
                ...state.messagesByConv,
                [conversationId]: merged
              },
              lastSyncByConv: {
                ...state.lastSyncByConv,
                [conversationId]: newLastSync
              }
            };
          });
        },
        
        handleError: (data) => {
          console.error('[RT-Chat] Error:', JSON.stringify(data, null, 2));
        },
        
        handleConvUpsert: (data) => {
          /**
           * Handle conv:upsert event from server.
           * Server sends full conversation DTO after message sent.
           * This replaces polling for pending conversations.
           */
          const conv = data.conversation as ConversationUI;
          if (!conv) return;
          
          set((state) => {
            // Check if pending or accepted based on current user's membership
            const currentUserId = useAuthStore.getState().user?.id;
            const myMember = conv.members.find(m => m.userId === currentUserId);
            const isPending = myMember && !myMember.isAccepted;
            
            if (isPending) {
              // Update or add to pendingConversations
              const existing = state.pendingConversations.findIndex(c => c.id === conv.id);
              if (existing >= 0) {
                const updated = [...state.pendingConversations];
                updated[existing] = conv;
                return { pendingConversations: updated };
              } else {
                return { pendingConversations: [conv, ...state.pendingConversations] };
              }
            } else {
              // Update or add to accepted conversations
              const existing = state.conversations.findIndex(c => c.id === conv.id);
              if (existing >= 0) {
                const updated = [...state.conversations];
                updated[existing] = conv;
                return { conversations: updated };
              } else {
                return { conversations: [conv, ...state.conversations] };
              }
            }
          });
        }
      };
    },
    {
      name: 'rt-chat-storage',
      partialize: (state) => ({
        lastReadByConv: state.lastReadByConv,
        lastSyncByConv: state.lastSyncByConv
      })
    }
  )
);

// Auto-load conversations when logged in
useAuthStore.subscribe((state, prevState) => {
  if (state.user && !prevState.user) {
    console.log('[RT-Chat] User logged in, loading conversations...');
    setTimeout(() => {
      useRTChatStore.getState().loadConversations();
    }, 1000);
  } else if (!state.user && prevState.user) {
    console.log('[RT-Chat] User logged out, clearing conversations...');
    useRTChatStore.setState({
      conversations: [],
      activeConversationId: null,
      messagesByConv: {},
      typingByConv: {},
      presenceByUser: {}
    });
  }
});
