/**
 * Helper utilities for realtime chat UX
 */

import type { ConversationUI, MessageUI } from '../state/rt_chat_store';
import type { Attachment } from '../types/attachment';

/**
 * Generate accurate conversation preview text from lastMessage
 * Handles all content types: text, image, file, deleted, empty
 */
export function getConversationPreview(
  conv: ConversationUI,
  currentUserId: string | undefined
): string {
  const lastMsg = conv.lastMessage;
  
  if (!lastMsg) {
    return 'Bắt đầu cuộc trò chuyện...';
  }
  
  const isOwnMessage = lastMsg.senderId === currentUserId;
  const prefix = isOwnMessage ? 'Bạn: ' : '';
  
  if (lastMsg.deletedAt || (lastMsg as any).deleted_at) {
    return `${prefix}Tin nhắn đã bị thu hồi`;
  }
  
  const contentType = (lastMsg as any).contentType || (lastMsg as any).content_type;
  const attachments = (lastMsg as any).attachments || [];
  
  if (contentType === 'image' || (attachments.length > 0 && isImageAttachment(attachments[0]))) {
    return `${prefix}Ảnh`;
  }
  
  if (contentType === 'file' || attachments.length > 0) {
    const firstFile = attachments[0];
    if (firstFile && firstFile.name) {
      return `${prefix}Tệp: ${firstFile.name}`;
    }
    return `${prefix}Đã gửi tệp`;
  }
  
  const content = lastMsg.content || '';
  if (content.trim()) {
    return `${prefix}${content.trim().replace(/\n/g, ' ').substring(0, 50)}${content.length > 50 ? '...' : ''}`;
  }
  
  return `${prefix}Tin nhắn mới`;
}

/**
 * Check if attachment is an image
 */
function isImageAttachment(attachment: Attachment): boolean {
  if (!attachment || !attachment.mime_type) return false;
  return attachment.mime_type.startsWith('image/');
}

/**
 * Scroll to a specific message by ID with optional smooth behavior
 */
export function scrollToMessage(
  messageId: string,
  behavior: ScrollBehavior = 'smooth',
  block: ScrollLogicalPosition = 'center'
): void {
  const element = document.getElementById(`msg-${messageId}`);
  if (element) {
    element.scrollIntoView({ behavior, block });
  }
}

/**
 * Check if user is near the bottom of scroll container
 */
export function isNearBottom(
  scrollElement: HTMLElement | null,
  threshold: number = 60
): boolean {
  if (!scrollElement) return true;
  
  const { scrollTop, scrollHeight, clientHeight } = scrollElement;
  return scrollHeight - scrollTop - clientHeight < threshold;
}

/**
 * Get snippet text from message for pinned bar preview
 */
export function getMessageSnippet(message: MessageUI, maxLength: number = 40): string {
  if (message.deletedAt) {
    return 'Tin nhắn đã bị thu hồi';
  }
  
  if (message.contentType === 'image') {
    return 'Ảnh';
  }
  
  if (message.contentType === 'file' && message.attachments && message.attachments.length > 0) {
    return `Tệp: ${message.attachments[0].name}`;
  }
  
  const content = message.content || '';
  if (content.trim()) {
    const oneLine = content.trim().replace(/\n/g, ' ');
    return oneLine.length > maxLength
      ? `${oneLine.substring(0, maxLength)}...`
      : oneLine;
  }
  
  return 'Tin nhắn';
}
