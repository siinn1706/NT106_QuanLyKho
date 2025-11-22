import { useUIStore } from "../../state/ui_store";

export default function TypingIndicator() {
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  return (
    <div className="flex items-start pl-4 py-2">
      <div className="flex items-center gap-1">
        <span className={`text-sm font-bold ${isDarkMode ? "text-zinc-400" : "text-zinc-600"}`}>
          Đang nhập
        </span>
        <div className="flex gap-1 ml-1">
          <span className="font-bold animate-bounce" style={{ animationDelay: "0ms" }}>
            .
          </span>
          <span className="font-bold animate-bounce" style={{ animationDelay: "150ms" }}>
            .
          </span>
          <span className="font-bold animate-bounce" style={{ animationDelay: "300ms" }}>
            .
          </span>
        </div>
      </div>
    </div>
  );
}
