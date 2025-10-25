using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;
using NT106_Nhom12_Pro.Utils;

namespace NT106_Nhom12_Pro.Forms
{
    public partial class RegisterForm : Form
    {
        private bool passwordVisible = false;

        public RegisterForm()
        {
            InitializeComponent();
            InitializeCustomComponents();
            Theme.OnThemeChanged += ApplyTheme;
            ApplyTheme();
            this.FormClosing += RegisterForm_FormClosing;
        }

        private void RegisterForm_FormClosing(object sender, FormClosingEventArgs e)
        {
            Theme.OnThemeChanged -= ApplyTheme;
        }

        private void InitializeCustomComponents()
        {
            logoPicture.Paint += LogoPicture_Paint;
            themeToggleButton.Click += ThemeToggleButton_Click;
            togglePasswordButton.Click += TogglePasswordButton_Click;
            registerButton.Click += RegisterButton_Click;
            loginLinkLabel.Click += LoginLinkLabel_Click;

            loginLinkLabel.MouseEnter += (s, e) =>
                loginLinkLabel.ForeColor = Color.FromArgb(0, 136, 255);
            loginLinkLabel.MouseLeave += (s, e) =>
                loginLinkLabel.ForeColor = Color.FromArgb(0, 102, 204);

            emailTextBox.GotFocus += (s, e) =>
            {
                if (emailTextBox.Text == "Enter your email")
                {
                    emailTextBox.Text = "";
                }
            };
        }

        private void ApplyTheme()
        {
            this.BackColor = Theme.Colors.Background;
            leftPanel.BackColor = Theme.Colors.Background;

            logoLabel.ForeColor = Theme.Colors.TextPrimary;
            welcomeLabel.ForeColor = Theme.Colors.TextPrimary;
            subtitleLabel.ForeColor = Theme.Colors.TextMuted;
            emailLabel.ForeColor = Theme.Colors.TextSecondary;
            passwordLabel.ForeColor = Theme.Colors.TextSecondary;
            loginTextLabel.ForeColor = Theme.Colors.TextMuted;

            emailTextBox.BackColor = Theme.Colors.InputBackground;
            emailTextBox.ForeColor = Theme.Colors.TextPrimary;
            passwordTextBox.BackColor = Theme.Colors.InputBackground;
            passwordTextBox.ForeColor = Theme.Colors.TextPrimary;

            themeToggleButton.BackColor = Theme.Colors.Background;
            themeToggleButton.Text = Theme.CurrentMode == ThemeMode.Light ? "🌙" : "☀️";

            this.Invalidate(true);
        }

        private void ThemeToggleButton_Click(object sender, EventArgs e)
        {
            Theme.CurrentMode = Theme.CurrentMode == ThemeMode.Light ? ThemeMode.Dark : ThemeMode.Light;
        }

        private void LogoPicture_Paint(object sender, PaintEventArgs e)
        {
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;

            using (LinearGradientBrush brush = new LinearGradientBrush(
                logoPicture.ClientRectangle,
                Theme.Colors.PrimaryPurpleLight,
                Theme.Colors.PrimaryPurple,
                45f))
            {
                using (GraphicsPath path = new GraphicsPath())
                {
                    path.AddEllipse(0, 0, logoPicture.Width, logoPicture.Height);
                    e.Graphics.FillPath(brush, path);
                }
            }

            string text = "🚀";
            using (Font font = new Font("Segoe UI", 20))
            {
                SizeF textSize = e.Graphics.MeasureString(text, font);
                PointF position = new PointF(
                    (logoPicture.Width - textSize.Width) / 2,
                    (logoPicture.Height - textSize.Height) / 2
                );
                e.Graphics.DrawString(text, font, Brushes.White, position);
            }
        }

        private void TogglePasswordButton_Click(object sender, EventArgs e)
        {
            passwordVisible = !passwordVisible;
            passwordTextBox.UseSystemPasswordChar = !passwordVisible;
            togglePasswordButton.Text = passwordVisible ? "👁️" : "👁";
        }

        private void RegisterButton_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(emailTextBox.Text) || emailTextBox.Text == "Enter your email")
            {
                MessageBox.Show("Please enter your email address", "Validation",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            if (string.IsNullOrWhiteSpace(passwordTextBox.Text))
            {
                MessageBox.Show("Please enter your password", "Validation",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            MessageBox.Show("Registration successful!", "Success",
                MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void LoginLinkLabel_Click(object sender, EventArgs e)
        {
            this.Hide();
            LoginForm loginForm = new LoginForm();
            loginForm.FormClosed += (s, args) => this.Close();
            loginForm.Show();
        }
    }
}
