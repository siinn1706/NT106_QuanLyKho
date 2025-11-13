/** ChatBot.tsx - Chatbot hỗ trợ người dùng
 *  - Hiển thị ở góc phải dưới màn hình.
 *  - Click để mở/đóng chat window.
 *  - Có thể hỏi về các chức năng: Hàng hoá, Nhập/Xuất, Nhà cung cấp, v.v.
 */

import { useState } from 'react';
import { useUIStore } from '../state/ui_store';

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

  // Các danh mục hỗ trợ nhanh
  const categories = [
    { id: 'items', label: 'Hàng hoá', icon: '📦' },
    { id: 'stock', label: 'Nhập/Xuất', icon: '📊' },
    { id: 'suppliers', label: 'Nhà cung cấp', icon: '🏢' },
    { id: 'reports', label: 'Báo cáo', icon: '📈' },
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
      {/* Chat Window */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50">
          {/* Chat Header */}
          <div className="bg-primary text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                🤖
              </div>
              <div>
                <h3 className="font-semibold">N3T Assistant</h3>
                <p className="text-xs opacity-90">Trợ lý quản lý kho</p>
              </div>
            </div>
            <button
              onClick={toggleChat}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Welcome Message + Category Selection */}
          {messages.length === 1 && (
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                Chào mừng bạn! Hãy chọn danh mục bạn cần hỗ trợ:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className="p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors text-left"
                  >
                    <span className="text-2xl mb-1 block">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-zinc-100 dark:bg-zinc-800 rounded-bl-none'
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

          {/* Input Area */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center text-2xl z-50"
        title="Mở trợ lý N3T"
      >
        💬
      </button>
    </>
  );
}
