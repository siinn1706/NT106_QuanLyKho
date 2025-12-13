import { useState } from "react";
import Icon from "../ui/Icon";
import { useUIStore } from "../../state/ui_store";
import ReactMarkdown from "react-markdown";

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
        <div className={`px-4 py-3 rounded-2xl text-sm max-w-[280px] transition-all ${
          mine 
            ? "bg-blue-500 text-white shadow-sm" 
            : isDarkMode
              ? "bg-zinc-800 text-zinc-100 shadow-sm"
              : "bg-gray-100 text-gray-900 shadow-sm"
        }`}>
          <div className="markdown-content">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                code: ({ children }) => (
                  <code className={`px-1 py-0.5 rounded ${
                    isDarkMode ? "bg-zinc-700" : "bg-zinc-300"
                  }`}>{children}</code>
                ),
                pre: ({ children }) => (
                  <pre className={`p-2 rounded my-2 overflow-x-auto ${
                    isDarkMode ? "bg-zinc-700" : "bg-zinc-300"
                  }`}>{children}</pre>
                ),
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
              }}
            >
              {text}
            </ReactMarkdown>
          </div>
        </div>

        {/* Action, không chiếm không gian khi ẩn */}
        <div className={`w-0 overflow-visible flex items-center ${mine ? "mr-20" : ""}`}>
          {showAction && (
            <div className="flex gap-1">
              {mine ? (
                <>
                  <button className={`p-1.5 rounded-full transition-all duration-200 backdrop-blur-sm ${
                    isDarkMode ? "hover:bg-zinc-700/80 text-zinc-400 hover:text-white" : "hover:bg-gray-200/80 text-gray-600 hover:text-gray-900"
                  }`}><Icon name="reply" size="sm" /></button>
                  <button className={`p-1.5 rounded-full transition-all duration-200 backdrop-blur-sm ${
                    isDarkMode ? "hover:bg-zinc-700/80 text-zinc-400 hover:text-white" : "hover:bg-gray-200/80 text-gray-600 hover:text-gray-900"
                  }`}><Icon name="smile" size="sm" /></button>
                  <button className={`p-1.5 rounded-full transition-all duration-200 backdrop-blur-sm ${
                    isDarkMode ? "hover:bg-zinc-700/80 text-zinc-400 hover:text-white" : "hover:bg-gray-200/80 text-gray-600 hover:text-gray-900"
                  }`}><Icon name="ellipsis-v" size="sm" /></button>
                </>
              ) : (
                <>
                  <button className={`p-1.5 rounded-full transition-all duration-200 backdrop-blur-sm ${
                    isDarkMode ? "hover:bg-zinc-700/80 text-zinc-400 hover:text-white" : "hover:bg-gray-200/80 text-gray-600 hover:text-gray-900"
                  }`}><Icon name="reply" size="sm" /></button>
                  <button className={`p-1.5 rounded-full transition-all duration-200 backdrop-blur-sm ${
                    isDarkMode ? "hover:bg-zinc-700/80 text-zinc-400 hover:text-white" : "hover:bg-gray-200/80 text-gray-600 hover:text-gray-900"
                  }`}><Icon name="smile" size="sm" /></button>
                  <button className={`p-1.5 rounded-full transition-all duration-200 backdrop-blur-sm ${
                    isDarkMode ? "hover:bg-zinc-700/80 text-zinc-400 hover:text-white" : "hover:bg-gray-200/80 text-gray-600 hover:text-gray-900"
                  }`}><Icon name="ellipsis-v" size="sm" /></button>
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
