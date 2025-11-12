// File: Views/Settings_View.Designer.cs

#nullable enable

using System;
using System.Drawing;
using System.Windows.Forms;
using Guna.UI2.WinForms;
using FontAwesome.Sharp;
using NT106_Nhom12_Pro.Utils;
using NT106_Nhom12_Pro.Forms;

namespace NT106_Nhom12_Pro.Views
{
    partial class Settings_View
    {
        private System.ComponentModel.IContainer? components = null;
        private Label lbl_Title = null!;
        private FlowLayoutPanel flow_Settings = null!;

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
            this.AutoScaleDimensions = new SizeF(96F, 96F);
            this.AutoScaleMode = AutoScaleMode.Dpi;
            this.BackColor = Theme_Colors.Light.Background;
            this.ClientSize = new Size(1130, 750);
            this.FormBorderStyle = FormBorderStyle.None;
            this.AutoScroll = true;

            lbl_Title = new Label
            {
                Text = "Cài Đặt Hệ Thống",
                Font = new Font(new FontFamily("Segoe UI"), 18F, FontStyle.Bold),
                ForeColor = Theme_Colors.Light.TextPrimary,
                Location = new Point(20, 20),
                AutoSize = true,
                BackColor = Color.Transparent
            };

            flow_Settings = new FlowLayoutPanel
            {
                Location = new Point(20, 80),
                Size = new Size(1090, 650),
                AutoSize = false,
                FlowDirection = FlowDirection.TopDown,
                WrapContents = false,
                BackColor = Color.Transparent,
                AutoScroll = true,
                Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom
            };

            // 1. Account Settings với NÚT ĐĂNG XUẤT
            var panel_Account = Create_Setting_Panel(
                "Tài Khoản",
                "Quản lý thông tin tài khoản của bạn",
                IconChar.UserCircle
            );

            var lbl_Username = new Label
            {
                Text = "Tên đăng nhập: cái gì đây",
                Font = new Font(new FontFamily("Segoe UI"), 10F),
                ForeColor = Theme_Colors.Light.TextSecondary,
                Location = new Point(60, 70),
                AutoSize = true,
                BackColor = Color.Transparent
            };

            var lbl_Email = new Label
            {
                Text = $"Email: {Login_Form.CurrentUserEmail}",
                Font = new Font(new FontFamily("Segoe UI"), 10F),
                ForeColor = Theme_Colors.Light.TextSecondary,
                Location = new Point(60, 95),
                AutoSize = true,
                BackColor = Color.Transparent
            };

            var btn_Change_Password = new Guna2Button
            {
                Text = "Đổi Mật Khẩu",
                Location = new Point(60, 125),
                Size = new Size(140, 38),
                FillColor = Theme_Colors.Accent.Blue,
                BorderRadius = 8,
                Font = new Font(new FontFamily("Segoe UI"), 10F, FontStyle.Bold)
            };
            btn_Change_Password.Click += Btn_ChangePassword_Click;

            var btn_Edit_Profile = new Guna2Button
            {
                Text = "Sửa Hồ Sơ",
                Location = new Point(210, 125),
                Size = new Size(140, 38),
                FillColor = Theme_Colors.Accent.Cyan,
                BorderRadius = 8,
                Font = new Font(new FontFamily("Segoe UI"), 10F, FontStyle.Bold)
            };
            btn_Edit_Profile.Click += (s, e) =>
            {
                MessageBox.Show("Tính năng sửa hồ sơ đang được phát triển!", "Thông báo",
                    MessageBoxButtons.OK, MessageBoxIcon.Information);
            };

            // NÚT ĐĂNG XUẤT - MỚI THÊM
            var btn_Logout = new Guna2Button
            {
                Text = "Đăng Xuất",
                Location = new Point(360, 125),
                Size = new Size(140, 38),
                FillColor = Theme_Colors.Accent.Red,
                BorderRadius = 8,
                Font = new Font(new FontFamily("Segoe UI"), 10F, FontStyle.Bold)
            };
            btn_Logout.Click += Btn_Logout_Click;

            panel_Account.Controls.AddRange(new Control[] {
                lbl_Username, lbl_Email, btn_Change_Password, btn_Edit_Profile, btn_Logout
            });

            // 2. Notification Settings
            var panel_Notifications = Create_Setting_Panel(
                "Thông Báo",
                "Cài đặt thông báo và cảnh báo",
                IconChar.Bell
            );

            var lbl_Email_Notif = new Label
            {
                Text = "Thông báo qua Email",
                Font = new Font(new FontFamily("Segoe UI"), 11F),
                ForeColor = Theme_Colors.Light.TextPrimary,
                Location = new Point(60, 70),
                AutoSize = true,
                BackColor = Color.Transparent
            };

            var toggle_Email = new Guna2ToggleSwitch
            {
                Location = new Point(920, 65),
                Checked = true
            };

            var lbl_Low_Stock = new Label
            {
                Text = "Cảnh báo hàng sắp hết",
                Font = new Font(new FontFamily("Segoe UI"), 11F),
                ForeColor = Theme_Colors.Light.TextPrimary,
                Location = new Point(60, 105),
                AutoSize = true,
                BackColor = Color.Transparent
            };

            var toggle_Low_Stock = new Guna2ToggleSwitch
            {
                Location = new Point(920, 100),
                Checked = true
            };

            panel_Notifications.Controls.AddRange(new Control[] {
                lbl_Email_Notif, toggle_Email, lbl_Low_Stock, toggle_Low_Stock
            });

            // 3. Update App
            var panel_Update = Create_Setting_Panel(
                "Cập Nhật Ứng Dụng",
                "Kiểm tra và cập nhật phiên bản mới",
                IconChar.ArrowsRotate
            );

            var lbl_Version = new Label
            {
                Text = "Phiên bản hiện tại: v1.0.0",
                Font = new Font(new FontFamily("Segoe UI"), 10F),
                ForeColor = Theme_Colors.Light.TextSecondary,
                Location = new Point(60, 70),
                AutoSize = true,
                BackColor = Color.Transparent
            };

            var lbl_Latest = new Label
            {
                Text = "Phiên bản mới nhất: v1.0.0",
                Font = new Font(new FontFamily("Segoe UI"), 10F),
                ForeColor = Theme_Colors.Accent.Green,
                Location = new Point(60, 95),
                AutoSize = true,
                BackColor = Color.Transparent
            };

            var btn_Check_Update = new Guna2Button
            {
                Text = "Kiểm Tra Cập Nhật",
                Location = new Point(60, 125),
                Size = new Size(160, 38),
                FillColor = Theme_Colors.Accent.Green,
                BorderRadius = 8,
                Font = new Font(new FontFamily("Segoe UI"), 10F, FontStyle.Bold)
            };
            btn_Check_Update.Click += (s, e) =>
            {
                MessageBox.Show("Bạn đang sử dụng phiên bản mới nhất!", "Cập Nhật",
                    MessageBoxButtons.OK, MessageBoxIcon.Information);
            };

            panel_Update.Controls.AddRange(new Control[] {
                lbl_Version, lbl_Latest, btn_Check_Update
            });

            // 4. Database Settings
            var panel_Database = Create_Setting_Panel(
                "Cơ Sở Dữ Liệu",
                "Quản lý kết nối Firebase",
                IconChar.Database
            );

            var lbl_Firebase_Status = new Label
            {
                Text = "Trạng thái: Đã kết nối ✓",
                Font = new Font(new FontFamily("Segoe UI"), 10F),
                ForeColor = Theme_Colors.Accent.Green,
                Location = new Point(60, 70),
                AutoSize = true,
                BackColor = Color.Transparent
            };

            var btn_Backup = new Guna2Button
            {
                Text = "Sao Lưu Dữ Liệu",
                Location = new Point(60, 105),
                Size = new Size(160, 38),
                FillColor = Theme_Colors.Accent.Orange,
                BorderRadius = 8,
                Font = new Font(new FontFamily("Segoe UI"), 10F, FontStyle.Bold)
            };
            btn_Backup.Click += (s, e) =>
            {
                MessageBox.Show("Đang sao lưu dữ liệu...", "Sao Lưu",
                    MessageBoxButtons.OK, MessageBoxIcon.Information);
            };

            var btn_Restore = new Guna2Button
            {
                Text = "Khôi Phục Dữ Liệu",
                Location = new Point(230, 105),
                Size = new Size(160, 38),
                FillColor = Theme_Colors.Accent.Purple,
                BorderRadius = 8,
                Font = new Font(new FontFamily("Segoe UI"), 10F, FontStyle.Bold)
            };
            btn_Restore.Click += (s, e) =>
            {
                MessageBox.Show("Chức năng khôi phục dữ liệu đang được phát triển!", "Khôi Phục",
                    MessageBoxButtons.OK, MessageBoxIcon.Information);
            };

            panel_Database.Controls.AddRange(new Control[] {
                lbl_Firebase_Status, btn_Backup, btn_Restore
            });

            // 5. About
            var panel_About = Create_Setting_Panel(
                "Về Ứng Dụng",
                "Thông tin về N3T - Quản Lý Kho",
                IconChar.InfoCircle
            );

            var lbl_App_Info = new Label
            {
                Text = "N3T - Hệ Thống Quản Lý Kho\nPhiên bản 1.0.0\n\nPhát triển bởi Nhóm 12\nNT106 - Lập Trình Mạng Căn Bản",
                Font = new Font(new FontFamily("Segoe UI"), 10F),
                ForeColor = Theme_Colors.Light.TextSecondary,
                Location = new Point(60, 70),
                AutoSize = true,
                BackColor = Color.Transparent
            };

            panel_About.Controls.Add(lbl_App_Info);

            // Add all panels
            flow_Settings.Controls.AddRange(new Control[] {
                panel_Account,
                panel_Notifications,
                panel_Update,
                panel_Database,
                panel_About
            });

            this.Controls.AddRange(new Control[] {
                lbl_Title,
                flow_Settings
            });
        }

        private void Btn_Logout_Click(object? sender, EventArgs e)
        {
            var result = MessageBox.Show(
                "Bạn có chắc muốn đăng xuất?",
                "Xác nhận đăng xuất",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question);

            if (result == DialogResult.Yes)
            {
                Logout();
            }
        }

        private Guna2Panel Create_Setting_Panel(string title, string description, IconChar icon)
        {
            var panel = new Guna2Panel
            {
                Size = new Size(1040, 180),
                BorderRadius = 12,
                FillColor = Theme_Colors.Light.CardBackground,
                ShadowDecoration = { Enabled = false },
                Margin = new Padding(0, 0, 0, 15)
            };

            var iconPic = new IconPictureBox
            {
                IconChar = icon,
                IconColor = Theme_Colors.Accent.Cyan,
                IconSize = 32,
                Size = new Size(32, 32),
                Location = new Point(20, 20),
                BackColor = Color.Transparent
            };

            var lbl_Title = new Label
            {
                Text = title,
                Font = new Font(new FontFamily("Segoe UI"), 14F, FontStyle.Bold),
                ForeColor = Theme_Colors.Light.TextPrimary,
                AutoSize = true,
                Location = new Point(60, 18),
                BackColor = Color.Transparent
            };

            var lbl_Description = new Label
            {
                Text = description,
                Font = new Font(new FontFamily("Segoe UI"), 9F),
                ForeColor = Theme_Colors.Light.TextSecondary,
                AutoSize = true,
                Location = new Point(60, 42),
                BackColor = Color.Transparent
            };

            panel.Controls.AddRange(new Control[] { iconPic, lbl_Title, lbl_Description });
            return panel;
        }

        private void Btn_ChangePassword_Click(object sender, EventArgs e)
        {
            var changePasswordForm = new ChangePassword_Form();
            if(changePasswordForm.ShowDialog() == DialogResult.OK)
            {
                MessageBox.Show(
                    "Đổi mật khẩu thành công!\nBạn sẽ được đăng xuất để đăng nhập lại.",
                    "Thành công",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);

                Logout();
            }    
        }

        private void Logout()
        {
            // Clear session
            Login_Form.CurrentUserID = null;
            Login_Form.CurrentUserEmail = null;
            Login_Form.CurrentUserToken = null;
            Login_Form.CurrentUserRefreshToken = null;

            // Đóng Main Form và quay về Login
            var mainForm = this.FindForm();
            if (mainForm != null)
            {
                mainForm.Hide();
                var loginForm = new Login_Form();
                loginForm.Show();
                mainForm.Close();
            }
        }
    }
}
