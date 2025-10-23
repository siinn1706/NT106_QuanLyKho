using System;
using System.Windows.Forms;

namespace NT106_Nhom12_Pro
{
    public class LoginForm : Form
    {
        private TextBox txtUser;
        private TextBox txtPass;
        private CheckBox chkRemember;
        private Button btnLogin;
        private Button btnRegister;
        private Label lblUser;
        private Label lblPass;

        public LoginForm()
        {
            Text = "Login";
            Width = 520; Height = 320; StartPosition = FormStartPosition.CenterScreen;
            FormBorderStyle = FormBorderStyle.FixedSingle;
            MaximizeBox = false;
            lblUser = new Label { Text = "Username", Left = 30, Top = 30, AutoSize = true };
            txtUser = new TextBox { Left = 30, Top = 50, Width = 440 };
            lblPass = new Label { Text = "Password", Left = 30, Top = 90, AutoSize = true };
            txtPass = new TextBox { Left = 30, Top = 110, Width = 440, UseSystemPasswordChar = true };
            chkRemember = new CheckBox { Left = 30, Top = 145, Width = 200, Text = "Remember me" };
            btnLogin = new Button { Text = "Log in", Left = 30, Top = 190, Width = 140, Height = 36 };
            btnRegister = new Button { Text = "Register", Left = 190, Top = 190, Width = 140, Height = 36 };
            AcceptButton = btnLogin;
            CancelButton = btnRegister;
            btnLogin.Click += (s, e) =>
            {
                var user = txtUser.Text.Trim();
                var pass = txtPass.Text.Trim();
                if (string.IsNullOrEmpty(user) || string.IsNullOrEmpty(pass))
                {
                    MessageBox.Show("Please enter username & password.");
                    return;
                }
                var main = new MainForm(user);
                main.FormClosed += (_, __) => Show();
                Hide();
                main.Show();
            };
            btnRegister.Click += (s, e) =>
            {
                using (var reg = new RegisterForm())
                {
                    if (reg.ShowDialog(this) == DialogResult.OK)
                    {
                        txtUser.Text = reg.RegisteredUsername;
                        txtPass.Text = reg.RegisteredPassword;
                        txtPass.Focus();
                    }
                }
            };
            Controls.AddRange(new Control[] { lblUser, txtUser, lblPass, txtPass, chkRemember, btnLogin, btnRegister });
        }
    }
}
