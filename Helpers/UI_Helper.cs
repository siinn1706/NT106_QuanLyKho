// File: Helpers/UI_Helper.cs

using System;
using System.Drawing;
using System.Windows.Forms;
using Guna.UI2.WinForms;
using NT106_Nhom12_Pro.Utils;

namespace NT106_Nhom12_Pro.Helpers
{
    public static class UI_Helper
    {
        // Tạo card panel với shadow
        public static Guna2Panel Create_Card_Panel()
        {
            var panel = new Guna2Panel
            {
                BorderRadius = 10,
                ShadowDecoration = { Enabled = true, Depth = 10 },
                FillColor = Theme_Colors.Get_Card_Background(),
                Padding = new Padding(20)
            };
            return panel;
        }

        // Tạo stat card (như trong Figma)
        public static Guna2Panel Create_Stat_Card(string title, string value, Color accentColor, string icon = "")
        {
            var card = Create_Card_Panel();
            card.Size = new Size(300, 120);

            var lblValue = new Label
            {
                Text = value,
                Font = new Font("Segoe UI", 28F, FontStyle.Bold),
                ForeColor = Theme_Colors.Get_Text_Primary(),
                AutoSize = true,
                Location = new Point(20, 15)
            };

            var lblTitle = new Label
            {
                Text = title,
                Font = new Font("Segoe UI", 11F, FontStyle.Regular),
                ForeColor = Theme_Colors.Get_Text_Secondary(),
                AutoSize = true,
                Location = new Point(20, 65)
            };

            var progressBar = new Guna2ProgressBar
            {
                Location = new Point(20, 90),
                Size = new Size(260, 8),
                ProgressColor = accentColor,
                ProgressColor2 = accentColor,
                Value = 70
            };

            card.Controls.AddRange(new Control[] { lblValue, lblTitle, progressBar });
            return card;
        }

        // Apply rounded corners to form
        public static void Apply_Rounded_Corners(Form form, int radius = 20)
        {
            var shadowForm = new Guna.UI2.WinForms.Guna2ShadowForm
            {
                TargetForm = form,
                ShadowColor = Color.Black,
                BorderRadius = radius
            };
        }

        // Show confirmation dialog
        public static DialogResult Show_Confirmation(string message, string title = "Xác nhận")
        {
            return MessageBox.Show(message, title, MessageBoxButtons.YesNo, MessageBoxIcon.Question);
        }

        // Show success message
        public static void Show_Success(string message)
        {
            MessageBox.Show(message, "Thành công", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        // Show error message
        public static void Show_Error(string message)
        {
            MessageBox.Show(message, "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
