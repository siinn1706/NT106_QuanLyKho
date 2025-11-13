import { useState } from "react";
import { FaEllipsisV, FaRegSmile, FaReply } from "react-icons/fa";
import { useUIStore } from "../../state/ui_store";

export default function MessageBubble({ text, mine, time }: { text: string; mine?: boolean; time: string; }) {
  const [showAction, setShowAction] = useState(false);
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  
  return (
    <div 
      className={`flex items-end gap-1.5 ${mine ? "justify-end" : "justify-start"} group`} 
      onMouseEnter={() => setShowAction(true)} 
      onMouseLeave={() => setShowAction(false)}
    >
      {/* Tin nhắn bên tôi: thời gian - action - tin nhắn */}
      {mine && (
        <>
          <span className={`text-xs mb-1 ${
            isDarkMode ? "text-zinc-400" : "text-zinc-500"
          }`}>{time}</span>
          {showAction && (
            <div className="flex gap-0.5 mb-1">
              <button className={`p-1 rounded-full ${
                isDarkMode ? "hover:bg-zinc-700 text-zinc-400" : "hover:bg-zinc-200 text-zinc-600"
              }`}><FaEllipsisV size={14} /></button>
              <button className={`p-1 rounded-full ${
                isDarkMode ? "hover:bg-zinc-700 text-zinc-400" : "hover:bg-zinc-200 text-zinc-600"
              }`}><FaRegSmile size={14} /></button>
              <button className={`p-1 rounded-full ${
                isDarkMode ? "hover:bg-zinc-700 text-zinc-400" : "hover:bg-zinc-200 text-zinc-600"
              }`}><FaReply size={14} /></button>
            </div>
          )}
        </>
      )}
      
      <div className={`px-4 py-2 rounded-xl text-sm shadow max-w-md ${
        mine 
          ? "bg-primary text-white" 
          : isDarkMode
            ? "bg-zinc-800 text-zinc-100"
            : "bg-zinc-200 text-zinc-900"
      }`}>
        {text}
      </div>
      
      {/* Tin nhắn bên kia: tin nhắn - action - thời gian */}
      {!mine && (
        <>
          {showAction && (
            <div className="flex gap-0.5 mb-1">
              <button className={`p-1 rounded-full ${
                isDarkMode ? "hover:bg-zinc-700 text-zinc-400" : "hover:bg-zinc-200 text-zinc-600"
              }`}><FaReply size={14} /></button>
              <button className={`p-1 rounded-full ${
                isDarkMode ? "hover:bg-zinc-700 text-zinc-400" : "hover:bg-zinc-200 text-zinc-600"
              }`}><FaRegSmile size={14} /></button>
              <button className={`p-1 rounded-full ${
                isDarkMode ? "hover:bg-zinc-700 text-zinc-400" : "hover:bg-zinc-200 text-zinc-600"
              }`}><FaEllipsisV size={14} /></button>
            </div>
          )}
          <span className={`text-xs mb-1 ${
            isDarkMode ? "text-zinc-400" : "text-zinc-500"
          }`}>{time}</span>
        </>
      )}
    </div>
  );
}
