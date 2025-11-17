import { useState } from "react";
import { FaEllipsisV, FaRegSmile, FaReply } from "react-icons/fa";
import { useUIStore } from "../../state/ui_store";

export default function MessageBubble({
  text,
  mine,
  time,
  isLastInGroup,
}: {
  text: string;
  mine?: boolean;
  time: string;
  isLastInGroup?: boolean;
}) {
  const [showAction, setShowAction] = useState(false);
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  
  return (
    <div 
      className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
      onMouseEnter={() => setShowAction(true)} 
      onMouseLeave={() => setShowAction(false)}
    >
      {/* Hàng trên: bong bóng + action, action căn giữa theo chiều dọc */}
      <div className={`flex items-center gap-1.5 ${mine ? "flex-row-reverse" : "flex-row"}`}>
        {/* Bong bóng tin nhắn */}
        <div className={`px-4 py-2 rounded-xl text-sm shadow max-w-[280px] ${
          mine 
            ? "bg-primary text-white" 
            : isDarkMode
              ? "bg-zinc-800 text-zinc-100"
              : "bg-zinc-200 text-zinc-900"
        }`}>
          {text}
        </div>

        {/* Action, không chiếm không gian khi ẩn */}
        <div className={`w-0 overflow-visible flex items-center ${mine ? "mr-20" : ""}`}>
          {showAction && (
            <div className="flex gap-0.5">
              {mine ? (
                <>
                  <button className={`p-1 rounded-full ${
                    isDarkMode ? "hover:bg-zinc-700 text-zinc-400" : "hover:bg-zinc-200 text-zinc-600"
                  }`}><FaReply size={14} /></button>
                  <button className={`p-1 rounded-full ${
                    isDarkMode ? "hover:bg-zinc-700 text-zinc-400" : "hover:bg-zinc-200 text-zinc-600"
                  }`}><FaRegSmile size={14} /></button>
                  <button className={`p-1 rounded-full ${
                    isDarkMode ? "hover:bg-zinc-700 text-zinc-400" : "hover:bg-zinc-200 text-zinc-600"
                  }`}><FaEllipsisV size={14} /></button>
                </>
              ) : (
                <>
                  <button className={`p-1 rounded-full ${
                    isDarkMode ? "hover:bg-zinc-700 text-zinc-400" : "hover:bg-zinc-200 text-zinc-600"
                  }`}><FaReply size={14} /></button>
                  <button className={`p-1 rounded-full ${
                    isDarkMode ? "hover:bg-zinc-700 text-zinc-400" : "hover:bg-zinc-200 text-zinc-600"
                  }`}><FaRegSmile size={14} /></button>
                  <button className={`p-1 rounded-full ${
                    isDarkMode ? "hover:bg-zinc-700 text-zinc-400" : "hover:bg-zinc-200 text-zinc-600"
                  }`}><FaEllipsisV size={14} /></button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hàng dưới: thời gian, nằm trái/phải theo phía, chỉ cho tin cuối nhóm */}
      {isLastInGroup && (
        <span
          className={`text-xs mt-1 ${
            isDarkMode ? "text-zinc-400" : "text-zinc-500"
          }`}
        >
          {time}
        </span>
      )}
    </div>
  );
}
