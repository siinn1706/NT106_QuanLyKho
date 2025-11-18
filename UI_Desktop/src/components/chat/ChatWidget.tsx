import { useState } from "react";
import ChatSidebar from "./ChatSidebar";
import ChatRoom from "./ChatRoom";
import { FaTimes, FaCommentDots, FaMinus, FaChevronRight } from "react-icons/fa";
import { useUIStore } from "../../state/ui_store";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeId, setActiveId] = useState("bot");
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  return (
    <>
      <button
        onClick={() => {
          if (open && !minimized) {
            setMinimized(true);
          } else {
            setOpen(true);
            setMinimized(false);
          }
        }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition"
        title="Mở chat"
      >
        <FaCommentDots size={24} />
      </button>

      {open && !minimized && (
        <div
          role="dialog"
          aria-modal="true"
          className={`fixed bottom-24 right-6 rounded-2xl shadow-2xl flex z-50 overflow-hidden ${
          isDarkMode 
            ? "bg-zinc-900 border border-zinc-800" 
            : "bg-white border border-zinc-200"
        }`}
          style={{
            width: sidebarCollapsed ? "min(500px, calc(100vw - 48px))" : "min(780px, calc(100vw - 48px))",
            height: "min(480px, calc(100vh - 140px))",
          }}
        >
          {!sidebarCollapsed && (
            <ChatSidebar 
              onSelect={setActiveId} 
              activeId={activeId} 
              onToggle={() => setSidebarCollapsed(true)}
            />
          )}
          <div className="flex-1 flex flex-col relative">
            <ChatRoom conversationId={activeId} sidebarCollapsed={sidebarCollapsed} onExpandSidebar={() => setSidebarCollapsed(false)} />
          </div>
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              onClick={() => setMinimized(true)}
              className={`rounded-full w-8 h-8 flex items-center justify-center transition ${
                isDarkMode
                  ? "bg-zinc-800 hover:bg-zinc-700 text-white"
                  : "bg-zinc-200 hover:bg-zinc-300 text-zinc-800"
              }`}
              title="Thu nhỏ"
            >
              <FaMinus size={14} />
            </button>
            <button
              onClick={() => setOpen(false)}
              className={`rounded-full w-8 h-8 flex items-center justify-center transition ${
                isDarkMode
                  ? "bg-zinc-800 hover:bg-red-600 text-white"
                  : "bg-zinc-200 hover:bg-red-500 text-zinc-800"
              }`}
              title="Đóng chat"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
