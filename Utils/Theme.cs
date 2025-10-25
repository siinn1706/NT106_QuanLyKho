using System.Drawing;

namespace NT106_Nhom12_Pro.Utils
{
    public enum ThemeMode
    {
        Light,
        Dark
    }

    public static class Theme
    {
        private static ThemeMode _currentMode = ThemeMode.Light;

        public static ThemeMode CurrentMode
        {
            get => _currentMode;
            set
            {
                _currentMode = value;
                OnThemeChanged?.Invoke();
            }
        }

        public static event Action OnThemeChanged;

        public static class Colors
        {
            public static Color PrimaryPurple => Color.FromArgb(124, 58, 237);
            public static Color PrimaryPurpleLight => Color.FromArgb(147, 51, 234);
            public static Color PrimaryPurpleDark => Color.FromArgb(109, 40, 217);

            public static Color TextPrimary => CurrentMode == ThemeMode.Light
                ? Color.FromArgb(30, 30, 30)
                : Color.FromArgb(240, 240, 240);

            public static Color TextSecondary => CurrentMode == ThemeMode.Light
                ? Color.FromArgb(80, 80, 80)
                : Color.FromArgb(180, 180, 180);

            public static Color TextMuted => CurrentMode == ThemeMode.Light
                ? Color.FromArgb(120, 120, 120)
                : Color.FromArgb(160, 160, 160);

            public static Color Background => CurrentMode == ThemeMode.Light
                ? Color.White
                : Color.FromArgb(18, 18, 18);

            public static Color BackgroundSecondary => CurrentMode == ThemeMode.Light
                ? Color.FromArgb(250, 250, 250)
                : Color.FromArgb(30, 30, 30);

            public static Color InputBackground => CurrentMode == ThemeMode.Light
                ? Color.White
                : Color.FromArgb(35, 35, 35);

            public static Color Border => CurrentMode == ThemeMode.Light
                ? Color.FromArgb(230, 230, 230)
                : Color.FromArgb(60, 60, 60);

            public static Color SuccessGreen => Color.FromArgb(34, 197, 94);
            public static Color ErrorRed => Color.FromArgb(239, 68, 68);
            public static Color WarningYellow => Color.FromArgb(251, 191, 36);

            public static Color GlassWhite => Color.FromArgb(30, 255, 255, 255);
            public static Color GlassWhiteBorder => Color.FromArgb(40, 255, 255, 255);
            public static Color OverlayWhite => Color.FromArgb(100, 255, 255, 255);
        }

        public static class Fonts
        {
            public static Font TitleLarge => new Font("Segoe UI", 28, FontStyle.Bold);
            public static Font TitleMedium => new Font("Segoe UI", 20, FontStyle.Bold);
            public static Font TitleSmall => new Font("Segoe UI", 14, FontStyle.Bold);

            public static Font BodyLarge => new Font("Segoe UI", 13);
            public static Font BodyMedium => new Font("Segoe UI", 12);
            public static Font BodySmall => new Font("Segoe UI", 11);

            public static Font ButtonText => new Font("Segoe UI", 12, FontStyle.Bold);
            public static Font LabelText => new Font("Segoe UI", 10);

            public static Font CarouselTitle => new Font("Segoe UI", 36, FontStyle.Bold);
            public static Font CarouselDescription => new Font("Segoe UI", 13);

            public static Font LogoText => new Font("Segoe UI", 20);
        }

        public static class Spacing
        {
            public const int Small = 10;
            public const int Medium = 20;
            public const int Large = 30;
            public const int ExtraLarge = 50;

            public const int FormPadding = 70;
            public const int FieldSpacing = 70;
        }

        public static class Sizes
        {
            public const int ButtonHeight = 50;
            public const int TextBoxHeight = 45;
            public const int LogoSize = 50;

            public const int FormWidth = 600;
            public const int CarouselWidth = 700;
            public const int FormHeight = 800;
        }
    }
}
