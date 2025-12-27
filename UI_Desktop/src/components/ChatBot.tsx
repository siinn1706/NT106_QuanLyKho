/** ChatBot.tsx - Chatbot hỗ trợ người dùng
 *  - Hiển thị ở góc phải dưới màn hình.
 *  - Click để mở/đóng chat window.
 *  - Có thể hỏi về các chức năng: Hàng hoá, Nhập/Xuất, Nhà cung cấp, v.v.
 */

import { useState } from 'react';
import { useUIStore } from '../state/ui_store';
import Icon from './ui/Icon';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function ChatBot() {
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

  // Các danh mục hỗ trợ nhanh - dùng icon name thay vì emoji
  const categoryIcons: Record<string, string> = {
    'items': 'box',
    'stock': 'chart-bar',
    'suppliers': 'building',
    'reports': 'chart-line',
  };

  const categories = [
    { id: 'items', label: 'Hàng hoá' },
    { id: 'stock', label: 'Nhập/Xuất' },
    { id: 'suppliers', label: 'Nhà cung cấp' },
    { id: 'reports', label: 'Báo cáo' },
  ];

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
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
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                <Icon name="comment-dots" className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold">N3T Assistant</h3>
                <p className="text-xs text-white/80">Trợ lý quản lý kho</p>
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
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
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
          className="fixed bottom-6 right-6 w-14 h-14 liquid-glass-btn rounded-full flex items-center justify-center text-xl z-50 hover:scale-110 transition-all duration-300"
          title="Mở trợ lý N3T"
        >
          <Icon name="comment-dots" className="text-white" />
        </button>
      )}
    </>
  );
}
