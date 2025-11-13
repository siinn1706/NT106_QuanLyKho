import { useState, useEffect, useRef } from "react";
import { FaEllipsisV, FaRegSmile, FaReply, FaPaperclip, FaMicrophone, FaPaperPlane, FaBars } from "react-icons/fa";
import MessageBubble from "./MessageBubble";
import { useUIStore } from "../../state/ui_store";
import { apiChat } from "../../app/api_client";

type Message = {
  id: string;
  conversationId: string;
  sender: "user" | "agent" | "bot";
  text: string;
  createdAt: string;
};

const MOCK_MESSAGES: Message[] = [
  { id: "m1", conversationId: "bot", sender: "bot", text: "Xin chào! Tôi là trợ lý N3T.", createdAt: new Date().toISOString() },
];

export default function ChatRoom({ conversationId, sidebarCollapsed, onExpandSidebar }: { 
  conversationId: string;
  sidebarCollapsed?: boolean;
  onExpandSidebar?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  useEffect(() => {
    setMessages(MOCK_MESSAGES.filter((m) => m.conversationId === conversationId));
  }, [conversationId]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const newMsg: Message = {
      id: "m" + (messages.length + 1),
      conversationId,
      sender: "user",
      text: inputValue,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    const userText = inputValue;
    setInputValue("");

    // Gọi BE -> Gemini
    try {
      const res = await apiChat({ prompt: userText, system_instruction: "Bạn là trợ lý kho N3T, trả lời ngắn gọn." });
      const botMsg: Message = {
        id: "m" + (messages.length + 2),
        conversationId,
        sender: "bot",
        text: res.reply,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      const errMsg: Message = {
        id: "m" + (messages.length + 2),
        conversationId,
        sender: "bot",
        text: `Lỗi gọi AI: ${e?.message ?? e}`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    }
  };

  const getTime = (d: string) =>
    new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className={`flex flex-col h-full w-full relative ${
      isDarkMode ? "bg-zinc-950" : "bg-white"
    }`}>
      <div className={`flex justify-between items-center gap-3 px-6 py-3 border-b ${
        isDarkMode 
          ? "bg-zinc-900 border-zinc-800 text-white" 
          : "bg-zinc-100 border-zinc-300 text-zinc-900"
      }`}>
        <div className="flex items-center gap-2">
          {sidebarCollapsed && onExpandSidebar && (
            <button
              onClick={onExpandSidebar}
              className={`rounded-full w-8 h-8 flex items-center justify-center transition ${
                isDarkMode
                  ? "bg-zinc-800 hover:bg-zinc-700 text-white"
                  : "bg-zinc-200 hover:bg-zinc-300 text-zinc-800"
              }`}
              title="Mở danh sách"
            >
              <FaBars size={14} />
            </button>
          )}
          <h2 className={`font-semibold ${
            isDarkMode ? "text-white" : "text-zinc-800"
          }`}>Chat với Chatbot AI</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            text={m.text}
            time={getTime(m.createdAt)}
            mine={m.sender === "user"}
          />
        ))}
      </div>

      <div className={`flex items-center gap-2 p-4 border-t ${
        isDarkMode
          ? "bg-zinc-900 border-zinc-800"
          : "bg-zinc-100 border-zinc-300"
      }`}>
        <button className={`p-2 rounded ${
          isDarkMode ? "text-white hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-200"
        }`} title="Gửi file"><FaPaperclip /></button>
        <button className={`p-2 rounded ${
          isDarkMode ? "text-white hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-200"
        }`} title="Ghi âm"><FaMicrophone /></button>
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          type="text"
          placeholder="Nhập tin nhắn..."
          className={`flex-1 p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary ${
            isDarkMode
              ? "bg-zinc-800 border-zinc-700 text-white"
              : "bg-white border-zinc-300 text-zinc-900"
          }`}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); handleSend();
            }
          }}
        />
        <button className="text-white p-2 rounded bg-primary hover:bg-primary-dark" onClick={handleSend} title="Gửi">
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
}
