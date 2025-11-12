// File: Forms/Login_Form.Designer.cs

#nullable enable

using Guna.UI2.WinForms;
using NT106_Nhom12_Pro.Helpers;
using NT106_Nhom12_Pro.Utils;
using System;
using System.Drawing;
using System.Windows.Forms;

namespace NT106_Nhom12_Pro.Forms
{
    partial class Login_Form
    {
        private System.ComponentModel.IContainer? components = null;
        private Guna2Panel panel_Left = null!;
        private Guna2Panel panel_Right = null!;
        private Label lbl_Title = null!;
        private Label lbl_Subtitle = null!;
        private Guna2TextBox txt_Username = null!;
        private Guna2TextBox txt_Password = null!;
        private Guna2Button btn_Login = null!;
        private Guna2Button btn_Register = null!;
        private LinkLabel lnk_ForgotPassword = null!;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            this.components = new System.ComponentModel.Container();

            // Form
            this.AutoScaleDimensions = new SizeF(96F, 96F);
            this.AutoScaleMode = AutoScaleMode.Dpi;
            this.ClientSize = new Size(1000, 600);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.Text = "N3T - Quản Lý Kho - Đăng Nhập";
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;
            this.BackColor = Theme_Colors.Get_Background();

            // Left Panel - Branding
            panel_Left = new Guna2Panel
            {
                Dock = DockStyle.Left,
                Width = 400,
                FillColor = Theme_Colors.Accent.Cyan
            };

            var lbl_Brand = new Label
            {
                Text = "N3T",
                Font = new Font(new FontFamily("Segoe UI"), 48F, FontStyle.Bold),
                ForeColor = Color.White,
                AutoSize = true,
                Location = new Point(100, 200),
                BackColor = Color.Transparent
            };

            var lbl_Brand_Sub = new Label
            {
                Text = "Hệ Thống Quản Lý Kho",
                Font = new Font(new FontFamily("Segoe UI"), 16F),
                ForeColor = Color.White,
                AutoSize = true,
                Location = new Point(100, 280),
                BackColor = Color.Transparent
            };

            panel_Left.Controls.AddRange(new Control[] { lbl_Brand, lbl_Brand_Sub });

            // Right Panel - Login Form
            panel_Right = new Guna2Panel
            {
                Dock = DockStyle.Fill,
                FillColor = Theme_Colors.Get_Card_Background(),
                Padding = new Padding(60)
            };

            lbl_Title = new Label
            {
                Text = "Đăng Nhập",
                Font = new Font(new FontFamily("Segoe UI"), 28F, FontStyle.Bold),
                ForeColor = Theme_Colors.Get_Text_Primary(),
                AutoSize = true,
                Location = new Point(60, 100),
                BackColor = Color.Transparent
            };

            lbl_Subtitle = new Label
            {
                Text = "Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.",
                Font = new Font(new FontFamily("Segoe UI"), 10F),
                ForeColor = Theme_Colors.Get_Text_Secondary(),
                AutoSize = true,
                Location = new Point(60, 150),
                BackColor = Color.Transparent
            };

            txt_Username = new Guna2TextBox
            {
                Location = new Point(60, 210),
                Size = new Size(480, 45),
                PlaceholderText = "Tên đăng nhập",
                Font = new Font(new FontFamily("Segoe UI"), 11F),
                BorderRadius = 8,
                BorderColor = Theme_Colors.Get_Border()
            };

            txt_Password = new Guna2TextBox
            {
                Location = new Point(60, 275),
                Size = new Size(480, 45),
                PlaceholderText = "Mật khẩu",
                Font = new Font(new FontFamily("Segoe UI"), 11F),
                BorderRadius = 8,
                PasswordChar = '●',
                BorderColor = Theme_Colors.Get_Border()
            };

            // Forgot Password Link
            lnk_ForgotPassword = new LinkLabel
            {
                Text = "Quên mật khẩu?",
                Location = new Point(440, 330),
                AutoSize = true,
                Font = new Font(new FontFamily("Segoe UI"), 9.5F),
                LinkColor = Theme_Colors.Accent.Cyan,
                ActiveLinkColor = Theme_Colors.Accent.Cyan,
                VisitedLinkColor = Theme_Colors.Accent.Cyan,
                BackColor = Color.Transparent,
                LinkBehavior = LinkBehavior.HoverUnderline
            };
            lnk_ForgotPassword.LinkClicked += Lnk_ForgotPassword_LinkClicked;

            btn_Login = new Guna2Button
            {
                Text = "Đăng Nhập",
                Location = new Point(60, 365),
                Size = new Size(480, 50),
                FillColor = Theme_Colors.Accent.Cyan,
                Font = new Font(new FontFamily("Segoe UI"), 12F, FontStyle.Bold),
                BorderRadius = 10
            };
            btn_Login.Click += Btn_Login_Click;

            btn_Register = new Guna2Button
            {
                Text = "Tạo tài khoản mới",
                Location = new Point(60, 430),
                Size = new Size(480, 50),
                FillColor = Color.Transparent,
                ForeColor = Theme_Colors.Accent.Cyan,
                Font = new Font(new FontFamily("Segoe UI"), 11F),
                BorderRadius = 10,
                BorderColor = Theme_Colors.Accent.Cyan,
                BorderThickness = 2
            };
            btn_Register.Click += Btn_Register_Click;

            panel_Right.Controls.AddRange(new Control[] {
                lbl_Title, lbl_Subtitle, txt_Username, txt_Password,
                lnk_ForgotPassword, btn_Login, btn_Register
            });

            this.Controls.AddRange(new Control[] { panel_Right, panel_Left });
        }

        private async void Btn_Login_Click(object? sender, EventArgs e)
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(txt_Username.Text))
            {
                MessageBox.Show("Vui lòng nhập email!", "Thông báo",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txt_Username.Focus();
                return;
            }

            if (string.IsNullOrWhiteSpace(txt_Password.Text))
            {
                MessageBox.Show("Vui lòng nhập mật khẩu!", "Thông báo",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txt_Password.Focus();
                return;
            }

            // Disable buttons và show loading
            btn_Login.Enabled = false;
            btn_Register.Enabled = false;
            lnk_ForgotPassword.Enabled = false;
            btn_Login.Text = "Đang đăng nhập...";
            this.Cursor = Cursors.WaitCursor;

            try
            {
                // Gọi Firebase Authentication
                var userCredential = await FirebaseAuthHelper.LoginAsync(
                    txt_Username.Text.Trim(),
                    txt_Password.Text
                );

                // Lưu thông tin user
                CurrentUserID = userCredential.User.Uid;
                CurrentUserEmail = userCredential.User.Info.Email;
                CurrentUserToken = await userCredential.User.GetIdTokenAsync();

                MessageBox.Show($"Đăng nhập thành công!\nChào mừng {CurrentUserEmail}",
                    "Thành công",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);

                // Chuyển sang Main Form
                this.Hide();
                var mainForm = new Main_Form();
                mainForm.FormClosed += (s, args) =>
                {
                    // Clear session khi đóng main form
                    CurrentUserID = null;
                    CurrentUserEmail = null;
                    CurrentUserToken = null;
                    this.Close();
                };
                mainForm.Show();
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, "Lỗi đăng nhập",
                    MessageBoxButtons.OK, MessageBoxIcon.Error);

                // Focus lại password field
                txt_Password.SelectAll();
                txt_Password.Focus();
            }
            finally
            {
                // Reset UI
                btn_Login.Enabled = true;
                btn_Register.Enabled = true;
                lnk_ForgotPassword.Enabled = true;
                btn_Login.Text = "Đăng Nhập";
                this.Cursor = Cursors.Default;
            }
        }

        private void Btn_Register_Click(object? sender, EventArgs e)
        {

            var registerForm = new Register_Form();
            if (registerForm.ShowDialog() == DialogResult.OK)
            {
                if (!string.IsNullOrEmpty(registerForm.RegisteredEmail))
                {
                    txt_Username.Text = registerForm.RegisteredEmail;
                    txt_Password.Focus();
                }
            }
        }

        private void Lnk_ForgotPassword_LinkClicked(object? sender, LinkLabelLinkClickedEventArgs e)
        {
            var forgotPassword = new ForgotPassword_Form();
            forgotPassword.ShowDialog();
        }
    }
}