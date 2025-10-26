using System;

namespace NT106_Nhom12_Pro.Utils
{
    public enum Theme_Mode
    {
        Light,
        Dark
    }

    public static class Theme_Manager
    {
        // Khai báo controls giao diện
        private static Theme_Mode _current_Mode = Theme_Mode.Light;

        public static event Action On_Theme_Changed;

        public static Theme_Mode Current_Mode
        {
            get => _current_Mode;
            set
            {
                if (_current_Mode != value)
                {
                    _current_Mode = value;
                    On_Theme_Changed?.Invoke();
                }
            }
        }

        public static bool Is_Light_Mode => _current_Mode == Theme_Mode.Light;

        public static bool Is_Dark_Mode => _current_Mode == Theme_Mode.Dark;

        // Phương thức Toggle_Theme
        public static void Toggle_Theme()
        {
            Current_Mode = _current_Mode == Theme_Mode.Light ? Theme_Mode.Dark : Theme_Mode.Light;
        }
    }
}
