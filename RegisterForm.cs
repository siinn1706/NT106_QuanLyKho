using System;
using System.Windows.Forms;

namespace NT106_Nhom12_Pro
{
    public class RegisterForm : Form
    {
        private TextBox txtUser;
        private TextBox txtPass;
        private TextBox txtConfirm;
        private Button btnOk;
        private Button btnCancel;
        public string RegisteredUsername { get; private set; }
        public string RegisteredPassword { get; private set; }
        public RegisterForm()
        {
            Text = "Register";
            Width = 560; Height = 360; StartPosition = FormStartPosition.CenterParent;
            FormBorderStyle = FormBorderStyle.FixedSingle;
            MaximizeBox = false;
            var lblUser = new Label { Text = "New username", Left = 30, Top = 30, AutoSize = true };
            txtUser = new TextBox { Left = 30, Top = 50, Width = 480 };
            var lblPass = new Label { Text = "Password", Left = 30, Top = 90, AutoSize = true };
            txtPass = new TextBox { Left = 30, Top = 110, Width = 480, UseSystemPasswordChar = true };
            var lblConfirm = new Label { Text = "Confirm password", Left = 30, Top = 150, AutoSize = true };
            txtConfirm = new TextBox { Left = 30, Top = 170, Width = 480, UseSystemPasswordChar = true };
            btnOk = new Button { Text = "Create account", Left = 30, Top = 220, Width = 180, Height = 36 };
            btnCancel = new Button { Text = "Cancel", Left = 220, Top = 220, Width = 120, Height = 36 };
            AcceptButton = btnOk;
            CancelButton = btnCancel;
            btnOk.Click += (s, e) =>
            {
                var u = txtUser.Text.Trim();
                var p = txtPass.Text.Trim();
                var c = txtConfirm.Text.Trim();
                if (string.IsNullOrEmpty(u) || string.IsNullOrEmpty(p))
                {
                    MessageBox.Show("Please fill username & password.");
                    return;
                }
                if (p != c)
                {
                    MessageBox.Show("Passwords do not match.");
                    return;
                }
                RegisteredUsername = u;
                RegisteredPassword = p;
                DialogResult = DialogResult.OK;
                Close();
            };
            btnCancel.Click += (s, e) => { DialogResult = DialogResult.Cancel; Close(); };
            Controls.AddRange(new Control[] { lblUser, txtUser, lblPass, txtPass, lblConfirm, txtConfirm, btnOk, btnCancel });
        }
    }
}
