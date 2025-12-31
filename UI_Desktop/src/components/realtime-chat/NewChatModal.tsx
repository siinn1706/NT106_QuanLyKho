// src/components/realtime-chat/NewChatModal.tsx
/**
 * Modal to search for user by email and create direct conversation.
 */

import { useState, useEffect, useRef } from "react";
import { useThemeStore } from "../../theme/themeStore";
import { useRTChatStore } from "../../state/rt_chat_store";
import { BASE_URL } from "../../app/api_client";
import { useAuthStore } from "../../state/auth_store";
import Icon from "../ui/Icon";
import { resolveMediaUrl, getInitials } from "../../utils/mediaUrl";

interface UserSearchResult {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

export default function NewChatModal({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: (conversationId: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<UserSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  const isDarkMode = useThemeStore(state => state.isDarkMode);
  const createDirectConversation = useRTChatStore(state => state.createDirectConversation);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  useEffect(() => {
    if (!email.trim()) {
      setResult(null);
      setError(null);
      return;
    }
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = window.setTimeout(async () => {
      await searchUser(email.trim());
    }, 500);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [email]);
  
  const searchUser = async (searchEmail: string) => {
    /**
     * API: GET /rt/users/lookup?email=...
     * Purpose: Search user by email
     * Request (JSON): null
     * Response (JSON) [200]: { id, email, username, display_name, avatar_url }
     * Response Errors:
     * - 404: { "detail": "User not found" }
     * - 429: { "detail": "Too many requests" }
     */
    setIsSearching(true);
    setError(null);
    setResult(null);
    
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(
        `${BASE_URL}/rt/users/lookup?email=${encodeURIComponent(searchEmail)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 404) {
        setError("Không tìm thấy người dùng với email này");
        return;
      }
      
      if (response.status === 429) {
        setError("Quá nhiều yêu cầu, vui lòng thử lại sau");
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to search user');
      }
      
      const data: UserSearchResult = await response.json();
      
      const currentUser = useAuthStore.getState().user;
      if (data.id === currentUser?.id) {
        setError("Không thể chat với chính bạn");
        return;
      }
      
      setResult(data);
    } catch (e) {
      console.error('[NewChat] Search error:', e);
      setError("Có lỗi xảy ra khi tìm kiếm");
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleCreateChat = async () => {
    if (!result) return;
    
    setIsCreating(true);
    setError(null);
    
    try {
      const conversationId = await createDirectConversation(result.email);
      onSuccess(conversationId);
      onClose();
    } catch (e: any) {
      console.error('[NewChat] Create error:', e);
      setError(e.message || "Không thể tạo cuộc trò chuyện");
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-3xl p-6 shadow-ios-lg border ${
          isDarkMode
            ? "bg-zinc-900 border-zinc-700"
            : "bg-white border-zinc-300"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Tin nhắn mới</h2>
          <button
            onClick={onClose}
            className={`rounded-full w-9 h-9 flex items-center justify-center transition-all duration-200 hover:scale-105 ${
              isDarkMode
                ? "liquid-glass-ui-dark text-white"
                : "liquid-glass-ui text-gray-700"
            }`}
          >
            <Icon name="close" size="sm" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email người nhận</label>
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email..."
              className={`w-full px-4 py-2.5 rounded-2xl outline-none transition-all duration-200 ${
                isDarkMode
                  ? "bg-zinc-700 text-zinc-100 placeholder-zinc-400 border border-zinc-600"
                  : "liquid-glass-ui text-gray-800 placeholder-zinc-400"
              }`}
            />
          </div>
          
          {isSearching && (
            <div className="text-center text-sm text-zinc-500">
              <Icon name="spinner" size="sm" className="animate-spin inline-block" /> Đang tìm kiếm...
            </div>
          )}
          
          {error && (
            <div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}
          
          {result && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 border ${
                isDarkMode
                  ? "liquid-glass-ui-dark border-zinc-700"
                  : "liquid-glass-ui border-zinc-300"
              }`}
            >
              {resolveMediaUrl(result.avatar_url) ? (
                <img
                  src={resolveMediaUrl(result.avatar_url)!}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg"
                style={{ display: resolveMediaUrl(result.avatar_url) ? 'none' : 'flex' }}
              >
                {getInitials(result.display_name || result.username)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{result.display_name || result.username}</div>
                <div className="text-sm text-zinc-500 truncate">{result.email}</div>
              </div>
            </div>
          )}
          
          {result && (
            <button
              onClick={handleCreateChat}
              disabled={isCreating}
              className="w-full px-6 py-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isCreating ? (
                <>
                  <Icon name="spinner" size="sm" className="animate-spin inline-block mr-2" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Icon name="comment-dots" size="sm" className="inline-block mr-2" />
                  Bắt đầu chat
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
