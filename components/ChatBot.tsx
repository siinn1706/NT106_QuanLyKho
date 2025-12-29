/** ChatBot.tsx - Chatbot hỗ trợ người dùng
 *  - Hiển thị ở góc phải dưới màn hình.
 *  - Click để mở/đóng chat window.
 *  - Có thể hỏi về các chức năng: Hàng hoá, Nhập/Xuất, Nhà cung cấp, v.v.
 */

import { useState, useEffect } from 'react';
import { useUIStore } from '../state/ui_store';
import Icon from './ui/Icon';
import { BASE_URL } from '../app/api_client';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatbotConfig {
  avatar_url: string | null;
  bot_name: string;
  bot_description: string;
}

export default function ChatBot() {
  console.log('🔵 ChatBot component mounted');
  
  const { isChatOpen, toggleChat } = useUIStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi có thể giúp gì cho bạn về quản lý kho?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [chatbotConfig, setChatbotConfig] = useState<ChatbotConfig>({
    avatar_url: '/uploads/chatbot/chatbot_avatar.png',  // Set default để test
    bot_name: 'N3T Assistant',
    bot_description: 'Trợ lý quản lý kho',
  });

  // Load chatbot config từ API
  useEffect(() => {
    console.log('🤖 ChatBot useEffect triggered');
    console.log('🤖 BASE_URL:', BASE_URL);
    console.log('🤖 Loading chatbot config from:', `${BASE_URL}/api/chatbot/config`);
    
    fetch(`${BASE_URL}/api/chatbot/config`)
      .then(res => {
        console.log('🤖 Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('🤖 Chatbot config loaded:', data);
        setChatbotConfig(data);
      })
      .catch(err => console.error('❌ Error loading chatbot config:', err));
  }, []);

  // Hiển thị suggestions sau 5 giây
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSuggestions(true);
    }, 5000); // 5 giây

    // Cleanup timer khi component unmount
    return () => clearTimeout(timer);
  }, []);

  // Helper để lấy avatar URL
  const getAvatarUrl = () => {
    if (!chatbotConfig.avatar_url) {
      console.log('⚠️ No avatar_url in config');
      return null;
    }
    const url = chatbotConfig.avatar_url.startsWith('http') 
      ? chatbotConfig.avatar_url 
      : `${BASE_URL}${chatbotConfig.avatar_url}`;
    console.log('🖼️ Avatar URL:', url);
    return url;
  };

  // Các danh mục hỗ trợ nhanh - dùng icon name thay vì emoji
  const categoryIcons: Record<string, string> = {
    'items': 'box',
    'stock': 'chart-bar',
    'suppliers': 'building',
    'reports': 'chart-line',
  };

  const categories = [
    { id: 'items', label: 'Tồn kho' },
    { id: 'stock', label: 'Đơn hàng' },
    { id: 'suppliers', label: 'Nhà cung cấp' },
    { id: 'reports', label: 'Báo cáo' },
  ];

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowSuggestions(false); // Ẩn suggestions khi click
    const category = categories.find(c => c.id === categoryId);
    
    // Tạo message từ user
    const userMessage: Message = {
      id: Date.now().toString(),
      text: `Tôi muốn biết về ${category?.label}`,
      sender: 'user',
      timestamp: new Date(),
    };
    
    // Tạo response từ bot (giả lập)
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: `Bạn muốn biết gì về ${category?.label}? Tôi có thể giúp bạn với:\n- Thêm mới\n- Xem danh sách\n- Cập nhật thông tin`,
      sender: 'bot',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage, botMessage]);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };
    
    // Response giả lập từ bot
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: 'Cảm ơn bạn đã liên hệ. Đây là câu trả lời mẫu từ chatbot. Trong thực tế, phần này sẽ kết nối với AI service.',
      sender: 'bot',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage, botMessage]);
    setInputText('');
  };

  return (
    <>
      {/* Chat Window - Liquid Glass Design */}
      {isChatOpen && (
        <div className="fixed bottom-4 right-4 w-96 h-[600px] liquid-glass-card flex flex-col overflow-hidden z-50 animate-glass-in">
          {/* Chat Header - Glass effect with gradient */}
          <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white p-4 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 overflow-hidden">
                {getAvatarUrl() ? (
                  <img 
                    src={getAvatarUrl()!} 
                    alt="Bot Avatar" 
                    className="w-full h-full object-cover"
                    onLoad={() => console.log('✅ Avatar loaded successfully')}
                    onError={(e) => {
                      console.error('❌ Avatar failed to load:', getAvatarUrl());
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : null}
                {!getAvatarUrl() && <Icon name="robot" className="text-white" />}
              </div>
              <div>
                <h3 className="font-semibold">{chatbotConfig.bot_name}</h3>
                <p className="text-xs text-white/80">{chatbotConfig.bot_description}</p>
              </div>
            </div>
            <button
              onClick={toggleChat}
              className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/10 hover:border-white/30"
            >
              <Icon name="close" className="text-white" />
            </button>
          </div>

          {/* Welcome Message + Category Selection - Glass buttons */}
          {messages.length === 1 && (
            <div className="p-4 border-b border-[var(--border)]/50 bg-[var(--surface-1)]/50 backdrop-blur-sm">
              <p className="text-sm text-[var(--text-2)] mb-3">
                Chào mừng bạn! Hãy chọn danh mục bạn cần hỗ trợ:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className="p-3 liquid-glass-btn-secondary text-left group"
                  >
                    <span className="text-2xl mb-1 block">
                      <Icon name={categoryIcons[cat.id]} size="lg" className="text-[var(--primary)] group-hover:scale-110 transition-transform" />
                    </span>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages - Glass bubbles */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3 bg-[var(--surface-1)]/30 backdrop-blur-[2px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
              >
                {/* Avatar cho bot */}
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-full flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                    {getAvatarUrl() ? (
                      <img 
                        src={getAvatarUrl()!} 
                        alt="Bot Avatar" 
                        className="w-full h-full object-cover"
                        onError={() => console.error('❌ Message avatar load failed')}
                      />
                    ) : null}
                    {!getAvatarUrl() && <Icon name="robot" size="sm" className="text-white" />}
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl backdrop-blur-sm transition-all duration-200 ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white rounded-br-none border border-[var(--primary)]/50'
                      : 'bg-[var(--surface-2)]/80 rounded-bl-none border border-[var(--border)]/50'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{msg.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Suggestion Options - Hiển thị sau 5 giây */}
            {showSuggestions && (
              <div className="animate-glass-in flex gap-2">
                {/* Avatar cho suggestions */}
                <div className="w-8 h-8 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-full flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                  {getAvatarUrl() ? (
                    <img 
                      src={getAvatarUrl()!} 
                      alt="Bot Avatar" 
                      className="w-full h-full object-cover"
                      onError={() => console.error('❌ Suggestions avatar load failed')}
                    />
                  ) : null}
                  {!getAvatarUrl() && <Icon name="robot" size="sm" className="text-white" />}
                </div>
                <div className="bg-[var(--surface-2)]/80 rounded-2xl rounded-bl-none border border-[var(--border)]/50 backdrop-blur-sm p-4 max-w-[85%]">
                  <p className="text-sm text-[var(--text-2)] mb-3">
                    Xin chào! Tôi có thể giúp gì cho bạn?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className="p-3 liquid-glass-btn-secondary text-center group hover:scale-105 transition-all duration-200"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center group-hover:bg-[var(--primary)]/20 transition-colors">
                            <Icon 
                              name={categoryIcons[cat.id]} 
                              size="lg" 
                              className="text-[var(--primary)] group-hover:scale-110 transition-transform" 
                            />
                          </div>
                          <span className="text-xs font-medium text-[var(--text-1)]">{cat.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area - Glass input */}
          <div className="p-4 border-t border-[var(--border)]/50 bg-[var(--surface-1)]/70 backdrop-blur-md">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 liquid-glass-input"
              />
              <button
                onClick={handleSendMessage}
                className="liquid-glass-btn px-4 py-2"
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Button - Liquid Glass Floating Button */}
      {!isChatOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 w-14 h-14 liquid-glass-btn rounded-full flex items-center justify-center text-xl z-50 hover:scale-110 transition-all duration-300 shadow-lg overflow-hidden"
          title={`Mở ${chatbotConfig.bot_name}`}
        >
          {getAvatarUrl() ? (
            <img 
              src={getAvatarUrl()!} 
              alt="Chatbot" 
              className="w-full h-full object-cover"
              onLoad={() => console.log('✅ Floating button avatar loaded')}
              onError={(e) => {
                console.error('❌ Floating button avatar failed');
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <Icon name="robot" className="text-white text-2xl" />
          )}
        </button>
      )}
    </>
  );
}
