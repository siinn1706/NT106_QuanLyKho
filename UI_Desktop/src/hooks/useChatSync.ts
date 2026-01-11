/** useChatSync - Hook để sync chat messages với backend
 *  - Tự động save message mới lên server
 *  - Tự động save reactions lên server
 */

import { useEffect, useCallback, useRef } from 'react';
import { useChatStore, type Message, type ReplyInfo, type MessageReaction } from '../state/chat_store';
import { useAuthStore } from '../state/auth_store';
import {
  apiCreateChatMessage,
  apiUpdateMessageReactions,
  apiGetChatMessages,
  type ChatMessageCreate,
} from '../app/api_client';

// Convert frontend Message sang API format
function toApiMessage(msg: Message): ChatMessageCreate {
  // Convert MessageReaction[] to string[] (emoji only) for API compatibility
  const reactionsAsStrings = (msg.reactions || []).map(r => r.emoji);
  
  return {
    id: msg.id,
    conversation_id: msg.conversationId,
    sender: msg.sender,
    text: msg.text,
    reply_to: msg.replyTo ? {
      id: msg.replyTo.id,
      text: msg.replyTo.text,
      sender: msg.replyTo.sender,
    } : null,
    reactions: reactionsAsStrings,
  };
}

// Convert API message sang frontend format
function fromApiMessage(api: {
  id: string;
  conversation_id: string;
  sender: 'user' | 'agent' | 'bot';
  text: string;
  reply_to?: { id: string; text: string; sender: string } | null;
  reactions: string[];
  created_at: string;
}): Message {
  // Convert string[] reactions from API to MessageReaction[] format
  // For bot chat, we don't have userId info from backend, so use "unknown"
  // This is a limitation - ideally backend should return full reaction objects
  const reactionsArray: MessageReaction[] = api.reactions.map((emoji, index) => ({
    userId: `unknown_${index}`, // Backend doesn't provide userId for bot chat reactions
    emoji,
    createdAt: api.created_at, // Use message timestamp as fallback
  }));

  return {
    id: api.id,
    conversationId: api.conversation_id,
    sender: api.sender,
    text: api.text,
    createdAt: api.created_at,
    replyTo: api.reply_to ? {
      id: api.reply_to.id,
      text: api.reply_to.text,
      sender: api.reply_to.sender,
    } : null,
    reactions: reactionsArray,
  };
}

interface UseChatSyncOptions {
  conversationId: string;
  enabled?: boolean;
}

export function useChatSync({ conversationId, enabled = true }: UseChatSyncOptions) {
  const { user, token } = useAuthStore();
  const { loadFromServer } = useChatStore();
  
  const isAuthenticated = Boolean(user && token);
  const loadedRef = useRef(false);

  // Load messages từ server khi mount
  useEffect(() => {
    if (!enabled || !isAuthenticated || loadedRef.current) return;
    
    const load = async () => {
      try {
        const serverMessages = await apiGetChatMessages(conversationId);
        const messages = serverMessages.map(fromApiMessage);
        loadFromServer(conversationId, messages);
        loadedRef.current = true;
        console.log(`[ChatSync] Loaded ${messages.length} messages from server`);
      } catch (error) {
        console.warn('[ChatSync] Failed to load messages:', error);
      }
    };
    
    load();
  }, [conversationId, enabled, isAuthenticated, loadFromServer]);
  
  // Function để save message lên server (gọi sau khi addMessage)
  const saveMessage = useCallback(async (message: Message) => {
    if (!isAuthenticated) return;
    
    try {
      await apiCreateChatMessage(toApiMessage(message));
      console.log('[ChatSync] Saved message to server:', message.id);
    } catch (error) {
      console.warn('[ChatSync] Failed to save message:', error);
    }
  }, [isAuthenticated]);
  
  // Function để update reactions lên server
  const saveReactions = useCallback(async (messageId: string, reactions: MessageReaction[]) => {
    if (!isAuthenticated) return;
    
    try {
      await apiUpdateMessageReactions(messageId, reactions);
      console.log('[ChatSync] Saved reactions to server:', messageId);
    } catch (error) {
      console.warn('[ChatSync] Failed to save reactions:', error);
    }
  }, [isAuthenticated]);
  
  return {
    saveMessage,
    saveReactions,
    isAuthenticated,
  };
}

export default useChatSync;
