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
import type { Attachment, ContentType } from '../types/attachment';

export interface MessageReceipt {
  userId: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface MessageUI {
  id: string;
  conversationId: string;
  senderId: string;
  clientMessageId: string;
  content: string;
  contentType: ContentType;
  attachments?: Attachment[];
  replyToId?: string; // ID of message being replied to
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
  senderEmail?: string;
  senderDisplayName?: string;
  senderAvatarUrl?: string;
  receipts?: MessageReceipt[];
  reactions?: MessageReaction[];
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
  pinnedMessagesByConv: Record<string, string[]>;
  hiddenMessagesByConv: Record<string, string[]>;
  
  setWSStatus: (status: 'connecting' | 'open' | 'closed') => void;
  loadConversations: () => Promise<void>;
  loadPendingConversations: () => Promise<void>;  // NEW
  acceptConversation: (conversationId: string) => Promise<void>;  // NEW
  rejectConversation: (conversationId: string, deleteHistory?: boolean) => Promise<void>;  // NEW
  joinConversation: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, contentType?: MessageUI['contentType'], attachments?: any[], replyToId?: string) => void;
  editMessage: (conversationId: string, messageId: string, newContent: string) => void;
  deleteMessage: (conversationId: string, messageId: string, deleteForEveryone: boolean) => void;
  hideMessage: (conversationId: string, messageId: string) => void;
  pinMessage: (conversationId: string, messageId: string) => void;
  unpinMessage: (conversationId: string, messageId: string) => void;
  reportMessage: (conversationId: string, messageId: string, reason: string) => void;
  markRead: (conversationId: string, lastReadMessageId: string) => void;
  syncConversation: (conversationId: string, afterMessageId?: string) => void;
  createDirectConversation: (email: string) => Promise<string>;
  uploadFile: (file: File) => Promise<Attachment>;
  toggleReaction: (conversationId: string, messageId: string, emoji: string) => void;
  
  handleServerHello: (data: any) => void;
  handleMsgAck: (data: any) => void;
  handleMsgNew: (data: any) => void;
  handleMsgEdit: (data: any) => void;
  handleMsgDelete: (data: any) => void;
  handleMsgReact: (data: any) => void;
  handleMsgReactAck: (data: any) => void;
  handleMsgDelivered: (data: any) => void;
  handleMsgRead: (data: any) => void;
  handleTyping: (data: any) => void;
  handleConvSyncResult: (data: any) => void;
  handleConvUpsert: (data: any) => void;
  handleConvRejected: (data: any) => void;
  handleMsgPinned: (data: any) => void;
  handleMsgUnpinned: (data: any) => void;
  handleError: (data: any) => void;
  loadPinnedMessages: (conversationId: string) => Promise<void>;
}

export const useRTChatStore = create<RTChatState>()(
  persist(
    (set, get) => {
      // Setup WS event handlers
      const setupWSHandlers = () => {
        rtWSClient.on('server:hello', (msg) => get().handleServerHello(msg.data));
        rtWSClient.on('msg:ack', (msg) => get().handleMsgAck(msg.data));
        rtWSClient.on('msg:new', (msg) => get().handleMsgNew(msg.data));
        rtWSClient.on('msg:edit', (msg) => get().handleMsgEdit(msg.data));
        rtWSClient.on('msg:delete', (msg) => get().handleMsgDelete(msg.data));
        rtWSClient.on('msg:react', (msg) => get().handleMsgReact(msg.data));
        rtWSClient.on('msg:react:ack', (msg) => get().handleMsgReactAck(msg.data));
        rtWSClient.on('msg:delivered', (msg) => get().handleMsgDelivered(msg.data));
        rtWSClient.on('msg:read', (msg) => get().handleMsgRead(msg.data));
        rtWSClient.on('typing', (msg) => get().handleTyping(msg.data));
        rtWSClient.on('conv:sync:result', (msg) => get().handleConvSyncResult(msg.data));
        rtWSClient.on('conv:upsert', (msg) => get().handleConvUpsert(msg.data));
        rtWSClient.on('conv:rejected', (msg) => get().handleConvRejected(msg.data));
        rtWSClient.on('msg:pinned', (msg) => get().handleMsgPinned(msg.data));
        rtWSClient.on('msg:unpinned', (msg) => get().handleMsgUnpinned(msg.data));
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
        pinnedMessagesByConv: {},
        hiddenMessagesByConv: {},
        
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
              await get().joinConversation(conv.id);
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
              await get().joinConversation(conversationId);
            }
          } catch (e) {
            console.error('[RT-Chat] Failed to accept conversation:', e);
          }
        },

        rejectConversation: async (conversationId: string, deleteHistory: boolean = false) => {
          /**
           * API: POST /rt/conversations/{id}/reject
           * Purpose: Reject pending conversation and optionally delete history
           * Request (JSON): { delete_history: boolean }
           * Response (JSON) [200]: { success: true }
           * Response Errors:
           * - 400: { "detail": "Conversation not found" }
           * - 401: { "detail": "Unauthorized" }
           * - 500: { "detail": "Internal Server Error" }
           * Notes: Sends WebSocket conv:rejected to other party
           */
          try {
            const token = useAuthStore.getState().token;
            const response = await fetch(`${BASE_URL}/rt/conversations/${conversationId}/reject`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ delete_history: deleteHistory })
            });
            
            if (!response.ok) {
              const error = await response.json().catch(() => ({ detail: 'Failed to reject conversation' }));
              throw new Error(error.detail);
            }
            
            // Remove conversation from pending list
            const pending = get().pendingConversations;
            set({
              pendingConversations: pending.filter(c => c.id !== conversationId)
            });

            // Also remove messages if deleting history
            if (deleteHistory) {
              set((state) => {
                const { [conversationId]: removed, ...rest } = state.messagesByConv;
                return { messagesByConv: rest };
              });
            }

            console.log('[RT-Chat] Conversation rejected:', conversationId, 'deleteHistory:', deleteHistory);
          } catch (e) {
            console.error('[RT-Chat] Failed to reject conversation:', e);
            throw e;
          }
        },
        
        joinConversation: async (conversationId: string) => {
          // Hydrate history from REST API if cache is empty (fix F5 history loss)
          const currentMessages = get().messagesByConv[conversationId];
          const hasCache = currentMessages && currentMessages.length > 0;
          
          if (!hasCache) {
            try {
              /**
               * API: GET /rt/conversations/{conversationId}/messages?limit=50
               * Purpose: Load recent messages for conversation history hydration
               * Request (JSON): null (query params only)
               * Response (JSON) [200]: {
               *   messages: [{ id, conversationId, senderId, content, contentType, attachments, createdAt, editedAt, deletedAt, senderEmail, senderDisplayName, senderAvatarUrl, receipts }],
               *   has_more: boolean
               * }
               * Response Errors:
               * - 401: { "detail": "Unauthorized" }
               * - 403: { "detail": "Not a member" }
               * - 404: { "detail": "Conversation not found" }
               * Notes: Returns messages in desc order by default (newest first), need to reverse for UI
               */
              const token = useAuthStore.getState().token;
              const response = await fetch(`${BASE_URL}/rt/conversations/${conversationId}/messages?limit=50`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                const messages: MessageUI[] = data.messages || [];
                
                // Messages come in desc order (newest first), reverse for chronological display
                const sortedMessages = messages.reverse();
                
                // Filter out hidden messages
                const hiddenIds = get().hiddenMessagesByConv[conversationId] || [];
                const visibleMessages = sortedMessages.filter(msg => !hiddenIds.includes(msg.id));
                
                // Populate cache
                set((state) => ({
                  messagesByConv: {
                    ...state.messagesByConv,
                    [conversationId]: visibleMessages
                  },
                  // Update lastSync to last message id so incremental sync works
                  lastSyncByConv: visibleMessages.length > 0
                    ? { ...state.lastSyncByConv, [conversationId]: visibleMessages[visibleMessages.length - 1].id }
                    : state.lastSyncByConv
                }));
                
                console.log(`[RT-Chat] Hydrated ${visibleMessages.length} messages for conversation ${conversationId}`);
              }
            } catch (e) {
              console.error('[RT-Chat] Failed to hydrate history:', e);
            }
          }
          
          // Send WS join
          rtWSClient.send({
            type: 'conv:join',
            reqId: `join-${Date.now()}`,
            data: { conversationId }
          });
          
          // Reset unread count when joining conversation
          set((state) => ({
            conversations: state.conversations.map(conv =>
              conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
            )
          }));
          
          // Load pinned messages from server (persisted pins)
          get().loadPinnedMessages(conversationId);
          
          // Sync to get any new messages (incremental from lastSync)
          get().syncConversation(conversationId);
          
          // Mark last message as read if exists (after sync completes)
          setTimeout(() => {
            const messages = get().messagesByConv[conversationId];
            if (messages && messages.length > 0) {
              const lastMsg = messages[messages.length - 1];
              get().markRead(conversationId, lastMsg.id);
            }
          }, 500);
        },
        
        sendMessage: (conversationId, content, contentType = 'text', attachments, replyToId) => {
          const currentUser = useAuthStore.getState().user;
          if (!currentUser) {
            console.error('[RT-Chat] Cannot send message: no current user');
            return;
          }
          
          console.log('[RT-Chat] Sending message to:', conversationId, 'content:', content, 'replyToId:', replyToId);
          
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
            replyToId, // Include reply reference
            createdAt: createdAtClient,
            senderEmail: currentUser.email,
            senderDisplayName: currentUser.display_name,
            senderAvatarUrl: currentUser.avatar_url,
            status: 'pending'
          };
          
          set((state) => {
            const updatedConversations = state.conversations.map(conv => {
              if (conv.id === conversationId) {
                return {
                  ...conv,
                  lastMessage: {
                    id: clientMessageId,
                    content,
                    senderId: currentUser.id,
                    createdAt: createdAtClient
                  },
                  updatedAt: createdAtClient
                };
              }
              return conv;
            }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            
            return {
              conversations: updatedConversations,
              messagesByConv: {
                ...state.messagesByConv,
                [conversationId]: [
                  ...(state.messagesByConv[conversationId] || []),
                  optimisticMsg
                ]
              }
            };
          });
          
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
              replyToId, // Send reply reference to backend
              createdAtClient
            }
          });
        },
        
        editMessage: (conversationId, messageId, newContent) => {
          /**
           * API: WebSocket msg:edit
           * Purpose: Edit message content (only own messages)
           * Request (JSON): { conversationId, messageId, content }
           * Response (JSON): WS event msg:edit with updated message
           * Notes: Server sets edited_at timestamp
           */
          // Optimistic update
          set((state) => {
            const messages = state.messagesByConv[conversationId] || [];
            const updatedMessages = messages.map(msg =>
              msg.id === messageId
                ? { ...msg, content: newContent, editedAt: new Date().toISOString() }
                : msg
            );

            return {
              messagesByConv: {
                ...state.messagesByConv,
                [conversationId]: updatedMessages
              }
            };
          });

          // Send WebSocket event
          rtWSClient.send({
            type: 'msg:edit',
            reqId: `edit-${Date.now()}`,
            data: {
              conversationId,
              messageId,
              content: newContent
            }
          });
        },

        deleteMessage: (conversationId, messageId, deleteForEveryone) => {
          /**
           * API: WebSocket msg:delete
           * Purpose: Delete message for everyone or set deleted_at
           * Request (JSON): { conversationId, messageId, deleteForEveryone }
           * Response (JSON): WS event msg:delete broadcasted to all members
           * Notes: If deleteForEveryone=false, only local hide (see hideMessage)
           */
          if (!deleteForEveryone) {
            // Local hide only
            get().hideMessage(conversationId, messageId);
            return;
          }

          // Optimistic update - mark as deleted
          set((state) => {
            const messages = state.messagesByConv[conversationId] || [];
            const updatedMessages = messages.map(msg =>
              msg.id === messageId
                ? { ...msg, deletedAt: new Date().toISOString(), content: 'Tin nhắn đã bị thu hồi' }
                : msg
            );

            return {
              messagesByConv: {
                ...state.messagesByConv,
                [conversationId]: updatedMessages
              }
            };
          });

          // Send WebSocket event
          rtWSClient.send({
            type: 'msg:delete',
            reqId: `delete-${Date.now()}`,
            data: {
              conversationId,
              messageId,
              deleteForEveryone: true
            }
          });
        },

        hideMessage: (conversationId, messageId) => {
          // Hide message locally only (remove from messagesByConv and track in hiddenMessagesByConv)
          set((state) => {
            const messages = state.messagesByConv[conversationId] || [];
            const updatedMessages = messages.filter(msg => msg.id !== messageId);
            
            const hiddenMessages = state.hiddenMessagesByConv[conversationId] || [];
            const updatedHidden = [...hiddenMessages, messageId];
            
            return {
              messagesByConv: {
                ...state.messagesByConv,
                [conversationId]: updatedMessages
              },
              hiddenMessagesByConv: {
                ...state.hiddenMessagesByConv,
                [conversationId]: updatedHidden
              }
            };
          });
        },
        
        toggleReaction: (conversationId, messageId, emoji) => {
          /**
           * API: WebSocket msg:react
           * Purpose: Toggle emoji reaction on message (add if not exists, remove if exists)
           * Request (JSON): { conversationId, messageId, emoji }
           * Response (JSON): WS event msg:react broadcasted to all members
           * Notes: Server handles toggle logic; optimistic update applied here
           */
          const currentUser = useAuthStore.getState().user;
          if (!currentUser) {
            console.error('[RT-Chat] Cannot react: no current user');
            return;
          }
          
          // Optimistic update - toggle reaction locally
          set((state) => {
            const messages = state.messagesByConv[conversationId] || [];
            const updatedMessages = messages.map(msg => {
              if (msg.id === messageId) {
                let reactions = msg.reactions || [];
                const existingIndex = reactions.findIndex(
                  r => r.userId === currentUser.id && r.emoji === emoji
                );
                
                if (existingIndex >= 0) {
                  // Remove reaction
                  reactions = reactions.filter((_, i) => i !== existingIndex);
                } else {
                  // Add reaction
                  reactions = [...reactions, {
                    userId: currentUser.id,
                    emoji,
                    createdAt: new Date().toISOString()
                  }];
                }
                
                return { ...msg, reactions };
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
          
          // Send WebSocket event
          rtWSClient.send({
            type: 'msg:react',
            reqId: `react-${Date.now()}`,
            data: {
              conversationId,
              messageId,
              emoji
            }
          });
        },

        pinMessage: (conversationId, messageId) => {
          /**
           * API: WebSocket msg:pin
           * Purpose: Pin a message in conversation (persisted in DB, synced to all clients)
           * Request (JSON): { conversationId, messageId }
           * Response: WS event msg:pinned broadcast to all members
           */
          const currentPinned = get().pinnedMessagesByConv[conversationId] || [];
          if (currentPinned.includes(messageId)) return;
          
          set((state) => ({
            pinnedMessagesByConv: {
              ...state.pinnedMessagesByConv,
              [conversationId]: [...currentPinned, messageId],
            },
          }));
          
          rtWSClient.send({
            type: 'msg:pin',
            reqId: `pin-${Date.now()}`,
            data: { conversationId, messageId }
          });
        },
        
        unpinMessage: (conversationId, messageId) => {
          /**
           * API: WebSocket msg:unpin
           * Purpose: Unpin a message from conversation (removed from DB, synced to all clients)
           * Request (JSON): { conversationId, messageId }
           * Response: WS event msg:unpinned broadcast to all members
           */
          set((state) => {
            const currentPinned = state.pinnedMessagesByConv[conversationId] || [];
            return {
              pinnedMessagesByConv: {
                ...state.pinnedMessagesByConv,
                [conversationId]: currentPinned.filter(id => id !== messageId),
              },
            };
          });
          
          rtWSClient.send({
            type: 'msg:unpin',
            reqId: `unpin-${Date.now()}`,
            data: { conversationId, messageId }
          });
        },
        
        loadPinnedMessages: async (conversationId: string) => {
          /**
           * API: GET /rt/conversations/{conversationId}/pinned
           * Purpose: Load persisted pinned messages for a conversation
           * Request (JSON): null
           * Response (JSON) [200]: [{ messageId, conversationId, pinnedBy, pinnedAt }]
           */
          try {
            const token = useAuthStore.getState().token;
            const response = await fetch(`${BASE_URL}/rt/conversations/${conversationId}/pinned`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              const pinnedIds = data.map((p: { messageId: string }) => p.messageId);
              
              set((state) => ({
                pinnedMessagesByConv: {
                  ...state.pinnedMessagesByConv,
                  [conversationId]: pinnedIds
                }
              }));
              
              console.log(`[RT-Chat] Loaded ${pinnedIds.length} pinned messages for conversation ${conversationId}`);
            }
          } catch (e) {
            console.error('[RT-Chat] Failed to load pinned messages:', e);
          }
        },
        
        reportMessage: (conversationId, messageId, reason) => {
          console.log('[RTChat] Reporting message:', messageId, 'Reason:', reason);
          alert(`Đã báo cáo tin nhắn: ${reason}`);
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
        
        uploadFile: async (file: File): Promise<Attachment> => {
          /**
           * API: POST /rt/files
           * Purpose: Upload file for chat
           * Request (JSON): multipart/form-data
           * Response (JSON) [200]: { file_id, url, name, size, mime_type }
           */
          const token = useAuthStore.getState().token;
          if (!token) {
            throw new Error('No authentication token');
          }
          
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch(`${BASE_URL}/rt/files`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
          
          if (response.status === 401) {
            // Token expired or invalid - logout user
            console.error('[RT-Chat] Upload failed: 401 Unauthorized, logging out...');
            useAuthStore.getState().logout();
            throw new Error('Session expired. Please login again.');
          }
          
          if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
            throw new Error(error.detail || 'Failed to upload file');
          }
          
          return await response.json() as Attachment;
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
            
            const pinnedMessages = state.pinnedMessagesByConv[conversationId] || [];
            const updatedPinned = pinnedMessages.map(id => 
              id === clientMessageId ? serverMessageId : id
            );
            
            const updatedConversations = state.conversations.map(conv => {
              if (conv.id === conversationId && conv.lastMessage?.id === clientMessageId) {
                return {
                  ...conv,
                  lastMessage: {
                    ...conv.lastMessage,
                    id: serverMessageId,
                    createdAt: createdAtServer
                  },
                  updatedAt: createdAtServer
                };
              }
              return conv;
            }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            
            return {
              messagesByConv: {
                ...state.messagesByConv,
                [conversationId]: updatedMessages
              },
              pinnedMessagesByConv: {
                ...state.pinnedMessagesByConv,
                [conversationId]: updatedPinned
              },
              conversations: updatedConversations
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
                  senderId: message.senderId,
                  contentType: message.contentType,
                  attachments: message.attachments,
                  createdAt: message.createdAt
                },
                unreadCount: isFromOther ? (conv.unreadCount || 0) + 1 : conv.unreadCount,
                updatedAt: message.createdAt
              };
            }
            return conv;
          }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          set({ conversations: updatedConversations });
        },

        handleMsgEdit: (data) => {
          /**
           * Handle msg:edit event from server
           * data: { message: { id, conversationId, content, editedAt, ... } }
           */
          const message = data.message;
          if (!message) return;
          
          const { id, conversationId, content, editedAt } = message;
          
          set((state) => {
            const messages = state.messagesByConv[conversationId] || [];
            const updatedMessages = messages.map(msg =>
              msg.id === id
                ? { ...msg, content, editedAt }
                : msg
            );

            const updatedConversations = state.conversations.map(conv => {
              if (conv.id === conversationId && conv.lastMessage?.id === id) {
                return {
                  ...conv,
                  lastMessage: {
                    ...conv.lastMessage,
                    content,
                    editedAt
                  }
                };
              }
              return conv;
            });

            return {
              messagesByConv: {
                ...state.messagesByConv,
                [conversationId]: updatedMessages
              },
              conversations: updatedConversations
            };
          });
        },

        handleMsgDelete: (data) => {
          /**
           * Handle msg:delete event from server
           * data: { message: { id, conversationId, deletedAt, ... } }
           */
          const message = data.message;
          if (!message) return;
          
          const { id, conversationId, deletedAt } = message;
          
          set((state) => {
            const messages = state.messagesByConv[conversationId] || [];
            const updatedMessages = messages.map(msg =>
              msg.id === id
                ? { ...msg, deletedAt, content: 'Tin nhắn đã bị thu hồi' }
                : msg
            );

            const updatedConversations = state.conversations.map(conv => {
              if (conv.id === conversationId && conv.lastMessage?.id === id) {
                return {
                  ...conv,
                  lastMessage: {
                    ...conv.lastMessage,
                    content: 'Tin nhắn đã bị thu hồi',
                    deletedAt
                  }
                };
              }
              return conv;
            });

            return {
              messagesByConv: {
                ...state.messagesByConv,
                [conversationId]: updatedMessages
              },
              conversations: updatedConversations
            };
          });
        },
        
        handleMsgReact: (data) => {
          /**
           * Handle msg:react event from server (realtime broadcast)
           * data: { conversationId, messageId, emoji, userId, action: 'added'|'removed', createdAt }
           */
          const { conversationId, messageId, emoji, userId, action, createdAt } = data;
          
          set((state) => {
            const messages = state.messagesByConv[conversationId] || [];
            const updatedMessages = messages.map(msg => {
              if (msg.id === messageId) {
                let reactions = msg.reactions || [];
                
                if (action === 'added') {
                  // Add reaction if not exists
                  const exists = reactions.some(r => r.userId === userId && r.emoji === emoji);
                  if (!exists) {
                    reactions = [...reactions, { userId, emoji, createdAt }];
                  }
                } else if (action === 'removed') {
                  // Remove reaction
                  reactions = reactions.filter(r => !(r.userId === userId && r.emoji === emoji));
                }
                
                return { ...msg, reactions };
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
        
        handleMsgReactAck: (data) => {
          /**
           * Handle msg:react:ack from server (ACK after sending reaction)
           * data: { conversationId, messageId, emoji, action, userId }
           */
          console.log('[RT Store] Reaction ACK:', data);
          // No state update needed - already handled by optimistic update in toggleReaction
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
            const hiddenIds = state.hiddenMessagesByConv[conversationId] || [];
            const merged = [...existing];
            
            for (const msg of messages) {
              // Skip hidden messages
              if (hiddenIds.includes(msg.id)) continue;
              
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
        },

        handleConvRejected: (data) => {
          /**
           * Handle conv:rejected event from server.
           * Sender receives notification that their conversation request was rejected.
           * data: { conversationId: string, rejectedBy: string }
           */
          const { conversationId, rejectedBy } = data;
          console.log('[RT-Chat] Conversation rejected:', conversationId, 'by:', rejectedBy);

          // Remove conversation from accepted list (if it was there)
          set((state) => ({
            conversations: state.conversations.filter(c => c.id !== conversationId),
            pendingConversations: state.pendingConversations.filter(c => c.id !== conversationId)
          }));

          // Show notification to user (handled by UI layer with toast)
          // Store rejection info for UI to display delete option
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('rt:conversation:rejected', { 
              detail: { conversationId, rejectedBy } 
            }));
          }
        },

        handleMsgPinned: (data) => {
          /**
           * Handle msg:pinned event from server.
           * Another user (or self from another device) pinned a message.
           * data: { conversationId, messageId, pinnedBy, pinnedAt }
           */
          const { conversationId, messageId } = data;
          console.log('[RT-Chat] Message pinned:', messageId, 'in conversation:', conversationId);
          
          set((state) => {
            const currentPinned = state.pinnedMessagesByConv[conversationId] || [];
            if (currentPinned.includes(messageId)) return state;
            
            return {
              pinnedMessagesByConv: {
                ...state.pinnedMessagesByConv,
                [conversationId]: [...currentPinned, messageId]
              }
            };
          });
        },

        handleMsgUnpinned: (data) => {
          /**
           * Handle msg:unpinned event from server.
           * Another user (or self from another device) unpinned a message.
           * data: { conversationId, messageId, unpinnedBy }
           */
          const { conversationId, messageId } = data;
          console.log('[RT-Chat] Message unpinned:', messageId, 'in conversation:', conversationId);
          
          set((state) => {
            const currentPinned = state.pinnedMessagesByConv[conversationId] || [];
            return {
              pinnedMessagesByConv: {
                ...state.pinnedMessagesByConv,
                [conversationId]: currentPinned.filter(id => id !== messageId)
              }
            };
          });
        }
      };
    },
    {
      name: 'rt-chat-storage',
      partialize: (state) => ({
        lastReadByConv: state.lastReadByConv,
        lastSyncByConv: state.lastSyncByConv,
        hiddenMessagesByConv: state.hiddenMessagesByConv
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
