// File: Utils/Theme_Colors.cs

#nullable enable

using System.Drawing;

namespace NT106_Nhom12_Pro.Utils
{
    public static class Theme_Colors
    {
        // Chỉ giữ Light Theme - BỎ Dark Mode
        public static class Light
        {
            public static readonly Color Background = Color.FromArgb(240, 244, 248);
            public static readonly Color Sidebar = Color.FromArgb(30, 41, 59);
            public static readonly Color CardBackground = Color.White;
            public static readonly Color TextPrimary = Color.FromArgb(30, 41, 59);
            public static readonly Color TextSecondary = Color.FromArgb(100, 116, 139);
            public static readonly Color Border = Color.FromArgb(226, 232, 240);
            public static readonly Color TopBar = Color.White;
        }

        // Accent Colors
        public static class Accent
        {
            public static readonly Color Cyan = Color.FromArgb(6, 182, 212);
            public static readonly Color Green = Color.FromArgb(34, 197, 94);
            public static readonly Color Red = Color.FromArgb(239, 68, 68);
            public static readonly Color Orange = Color.FromArgb(249, 115, 22);
            public static readonly Color Blue = Color.FromArgb(59, 130, 246);
            public static readonly Color Yellow = Color.FromArgb(234, 179, 8);
            public static readonly Color Purple = Color.FromArgb(168, 85, 247);
        }

        // Sidebar specific colors
        public static class Sidebar
        {
            public static readonly Color Background = Color.FromArgb(30, 41, 59);
            public static readonly Color TextActive = Color.FromArgb(6, 182, 212);
            public static readonly Color TextInactive = Color.FromArgb(148, 163, 184);
            public static readonly Color Hover = Color.FromArgb(51, 65, 85);
            public static readonly Color ActiveBorder = Color.FromArgb(6, 182, 212);
        }

        // Helper methods - luôn trả về Light theme
        public static Color Get_Background() => Light.Background;
        public static Color Get_Sidebar() => Light.Sidebar;
        public static Color Get_Card_Background() => Light.CardBackground;
        public static Color Get_Text_Primary() => Light.TextPrimary;
        public static Color Get_Text_Secondary() => Light.TextSecondary;
        public static Color Get_Border() => Light.Border;
        public static Color Get_Top_Bar() => Light.TopBar;
    }
}
