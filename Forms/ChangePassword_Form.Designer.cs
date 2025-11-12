using Guna.UI2.WinForms;
using NT106_Nhom12_Pro.Helpers;
using NT106_Nhom12_Pro.Utils;
using System;
using System.Drawing;
using System.Windows.Forms;

namespace NT106_Nhom12_Pro.Forms
{
    partial class ChangePassword_Form
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
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
            this.Size = new Size(600, 600);
            this.StartPosition = FormStartPosition.CenterParent;
            this.Text = "N3T - Đổi Mật Khẩu";
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.BackColor = Theme_Colors.Get_Background();

            panel_Main = new Guna2Panel
            {
                Dock = DockStyle.Fill,
                Padding = new Padding(50),
                FillColor = Theme_Colors.Get_Card_Background()
            };

            lbl_Title = new Label
            {
                Text = "🔐 Đổi Mật Khẩu",
                Font = new Font("Segoe UI", 26F, FontStyle.Bold),
                ForeColor = Theme_Colors.Get_Text_Primary(),
                Location = new Point(50, 40),
                AutoSize = true,
                BackColor = Color.Transparent
            };

            lbl_Info = new Label
            {
                Text = $"Tài khoản: {Login_Form.CurrentUserEmail}",
                Font = new Font("Segoe UI", 10F),
                ForeColor = Theme_Colors.Get_Text_Secondary(),
                Location = new Point(50, 100),
                Size = new Size(500, 30),
                BackColor = Color.Transparent
            };

            txt_CurrentPassword = new Guna2TextBox
            {
                Location = new Point(50, 150),
                Size = new Size(500, 45),
                PlaceholderText = "Mật khẩu hiện tại",
                Font = new Font("Segoe UI", 11F),
                BorderRadius = 8,
                PasswordChar = '●',
                BorderColor = Theme_Colors.Get_Border()
            };

            txt_NewPassword = new Guna2TextBox
            {
                Location = new Point(50, 220),
                Size = new Size(500, 45),
                PlaceholderText = "Mật khẩu mới (tối thiểu 6 ký tự)",
                Font = new Font("Segoe UI", 11F),
                BorderRadius = 8,
                PasswordChar = '●',
                BorderColor = Theme_Colors.Get_Border()
            };

            txt_ConfirmPassword = new Guna2TextBox
            {
                Location = new Point(50, 290),
                Size = new Size(500, 45),
                PlaceholderText = "Xác nhận mật khẩu mới",
                Font = new Font("Segoe UI", 11F),
                BorderRadius = 8,
                PasswordChar = '●',
                BorderColor = Theme_Colors.Get_Border()
            };

            chk_ShowPassword = new Guna2CheckBox
            {
                Location = new Point(50, 350),
                AutoSize = true,
                Text = "Hiển thị mật khẩu",
                Font = new Font("Segoe UI", 10F),
                ForeColor = Theme_Colors.Get_Text_Secondary(),
                CheckedState = { BorderColor = Theme_Colors.Accent.Cyan, FillColor = Theme_Colors.Accent.Cyan }
            };
            chk_ShowPassword.CheckedChanged += Chk_ShowPassword_CheckedChanged;

            btn_ChangePassword = new Guna2Button
            {
                Text = "Đổi Mật Khẩu",
                Location = new Point(50, 400),
                Size = new Size(500, 50),
                FillColor = Theme_Colors.Accent.Cyan,
                Font = new Font("Segoe UI", 12F, FontStyle.Bold),
                BorderRadius = 10
            };
            btn_ChangePassword.Click += Btn_ChangePassword_Click;

            btn_Cancel = new Guna2Button
            {
                Text = "Hủy",
                Location = new Point(50, 470),
                Size = new Size(500, 50),
                FillColor = Color.Transparent,
                ForeColor = Theme_Colors.Get_Text_Secondary(),
                Font = new Font("Segoe UI", 11F),
                BorderRadius = 10,
                BorderColor = Theme_Colors.Get_Border(),
                BorderThickness = 2
            };
            btn_Cancel.Click += (s, e) => this.Close();

            panel_Main.Controls.AddRange(new Control[] {
                lbl_Title, lbl_Info, txt_CurrentPassword, txt_NewPassword,
                txt_ConfirmPassword, chk_ShowPassword, btn_ChangePassword, btn_Cancel
            });

            this.Controls.Add(panel_Main);
        }

        private void Chk_ShowPassword_CheckedChanged(object? sender, EventArgs e)
        {
            char passwordChar = chk_ShowPassword.Checked ? '\0' : '●';
            txt_CurrentPassword.PasswordChar = passwordChar;
            txt_NewPassword.PasswordChar = passwordChar;
            txt_ConfirmPassword.PasswordChar = passwordChar;
        }

        private async void Btn_ChangePassword_Click(object? sender, EventArgs e)
        {
            // Validate
            if (string.IsNullOrWhiteSpace(txt_CurrentPassword.Text))
            {
                MessageBox.Show("Vui lòng nhập mật khẩu hiện tại!", "Thông báo",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txt_CurrentPassword.Focus();
                return;
            }

            if (string.IsNullOrWhiteSpace(txt_NewPassword.Text))
            {
                MessageBox.Show("Vui lòng nhập mật khẩu mới!", "Thông báo",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txt_NewPassword.Focus();
                return;
            }

            if (txt_NewPassword.Text.Length < 6)
            {
                MessageBox.Show("Mật khẩu mới phải có ít nhất 6 ký tự!", "Thông báo",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txt_NewPassword.Focus();
                return;
            }

            if (txt_NewPassword.Text != txt_ConfirmPassword.Text)
            {
                MessageBox.Show("Mật khẩu xác nhận không khớp!", "Thông báo",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txt_ConfirmPassword.Focus();
                return;
            }

            if (txt_CurrentPassword.Text == txt_NewPassword.Text)
            {
                MessageBox.Show("Mật khẩu mới phải khác mật khẩu hiện tại!", "Thông báo",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txt_NewPassword.Focus();
                return;
            }

            // Confirm
            var confirmResult = MessageBox.Show(
                "Bạn có chắc muốn đổi mật khẩu?\n\nSau khi đổi, bạn sẽ cần đăng nhập lại với mật khẩu mới.",
                "Xác nhận đổi mật khẩu",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question);

            if (confirmResult != DialogResult.Yes)
                return;

            // Disable buttons
            btn_ChangePassword.Enabled = false;
            btn_Cancel.Enabled = false;
            btn_ChangePassword.Text = "Đang đổi mật khẩu...";
            this.Cursor = Cursors.WaitCursor;

            try
            {
                // Đổi mật khẩu
                await FirebaseAuthHelper.ChangePasswordAsync(
                    txt_CurrentPassword.Text,
                    txt_NewPassword.Text
                );

                MessageBox.Show(
                    "✅ Đổi mật khẩu thành công!\n\n" +
                    "Vui lòng đăng nhập lại với mật khẩu mới.",
                    "Thành công",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);

                this.DialogResult = DialogResult.OK;
                this.Close();
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, "Lỗi đổi mật khẩu",
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
                txt_CurrentPassword.Focus();
            }
            finally
            {
                btn_ChangePassword.Enabled = true;
                btn_Cancel.Enabled = true;
                btn_ChangePassword.Text = "Đổi Mật Khẩu";
                this.Cursor = Cursors.Default;
            }
        }
    }
}