using System;
using System.Windows.Forms;

namespace NT106_Nhom12_Pro
{
    public class MainForm : Form
    {
        private readonly string _username;
        private Label lblWelcome;
        private Button btnLogout;
        public MainForm(string username)
        {
            _username = username;
            Text = "Home";
            Width = 560; Height = 320; StartPosition = FormStartPosition.CenterScreen;
            FormBorderStyle = FormBorderStyle.FixedSingle;
            MaximizeBox = false;
            lblWelcome = new Label { Left = 30, Top = 30, AutoSize = true, Text = $"Welcome, {_username}" };
            btnLogout = new Button { Text = "Log out", Left = 30, Top = 70, Width = 120, Height = 36 };
            btnLogout.Click += (s, e) => { Close(); };
            Controls.AddRange(new Control[] { lblWelcome, btnLogout });
        }
    }
}
