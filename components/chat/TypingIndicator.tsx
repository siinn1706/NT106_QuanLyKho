import { useThemeStore } from "../../theme/themeStore";

export default function TypingIndicator() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  return (
    <div className="flex items-start pl-4 py-2">
      <div className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl border border-white/20 bg-white/20 backdrop-blur-md shadow-sm">
        <span className="text-sm font-medium text-white/90">
          Đang nhập
        </span>
        <div className="flex gap-0.5 ml-0.5">
          <span className="text-white/90 font-bold animate-bounce" style={{ animationDelay: "0ms" }}>
            .
          </span>
          <span className="text-white/90 font-bold animate-bounce" style={{ animationDelay: "150ms" }}>
            .
          </span>
          <span className="text-white/90 font-bold animate-bounce" style={{ animationDelay: "300ms" }}>
            .
          </span>
        </div>
      </div>
    </div>
  );
}
