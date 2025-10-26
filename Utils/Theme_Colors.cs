using System.Drawing;

namespace NT106_Nhom12_Pro.Utils
{
    public class Theme_Colors
    {
        public static class Light_Mode
        {
            public static readonly Color Background = Color.White;
            public static readonly Color Text_Primary = Color.FromArgb(33, 33, 33);
            public static readonly Color Text_Secondary = Color.FromArgb(66, 66, 66);
            public static readonly Color Text_Muted = Color.FromArgb(120, 120, 120);
            public static readonly Color Input_Background = Color.FromArgb(250, 250, 250);
            public static readonly Color Input_Border = Color.FromArgb(200, 200, 200);
            public static readonly Color Primary_Purple = Color.FromArgb(124, 58, 237);
            public static readonly Color Primary_Purple_Light = Color.FromArgb(167, 139, 250);
            public static readonly Color Link_Color = Color.FromArgb(0, 102, 204);
            public static readonly Color Link_Hover = Color.FromArgb(0, 136, 255);
        }

        public static class Dark_Mode
        {
            public static readonly Color Background = Color.FromArgb(18, 18, 18);
            public static readonly Color Text_Primary = Color.FromArgb(240, 240, 240);
            public static readonly Color Text_Secondary = Color.FromArgb(200, 200, 200);
            public static readonly Color Text_Muted = Color.FromArgb(150, 150, 150);
            public static readonly Color Input_Background = Color.FromArgb(40, 40, 40);
            public static readonly Color Input_Border = Color.FromArgb(80, 80, 80);
            public static readonly Color Primary_Purple = Color.FromArgb(147, 51, 234);
            public static readonly Color Primary_Purple_Light = Color.FromArgb(196, 181, 253);
            public static readonly Color Link_Color = Color.FromArgb(96, 165, 250);
            public static readonly Color Link_Hover = Color.FromArgb(147, 197, 253);
        }
    }
}
