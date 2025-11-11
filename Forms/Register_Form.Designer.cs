// File: Forms/Register_Form.Designer.cs

#nullable enable

using System;
using System.Drawing;
using System.Windows.Forms;
using Guna.UI2.WinForms;
using NT106_Nhom12_Pro.Utils;

namespace NT106_Nhom12_Pro.Forms
{
    partial class Register_Form
    {
        private System.ComponentModel.IContainer? components = null;
        private Guna2Panel panel_Main = null!;
        private Label lbl_Title = null!;
        private Guna2TextBox txt_Username = null!;
        private Guna2TextBox txt_Password = null!;
        private Guna2TextBox txt_Confirm_Password = null!;
        private Guna2TextBox txt_Email = null!;
        private Guna2Button btn_Register = null!;
        private Guna2Button btn_Back = null!;

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

            this.AutoScaleDimensions = new SizeF(96F, 96F);
            this.AutoScaleMode = AutoScaleMode.Dpi;
            this.ClientSize = new Size(600, 700);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.Text = "N3T - Quản Lý Kho - Đăng Ký";
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Theme_Colors.Get_Background();

            panel_Main = new Guna2Panel
            {
                Dock = DockStyle.Fill,
                FillColor = Theme_Colors.Get_Card_Background(),
                Padding = new Padding(50)
            };

            lbl_Title = new Label
            {
                Text = "Đăng Ký Tài Khoản",
                Font = new Font(new FontFamily("Segoe UI"), 26F, FontStyle.Bold),
                ForeColor = Theme_Colors.Get_Text_Primary(),
                AutoSize = true,
                Location = new Point(50, 50),
                BackColor = Color.Transparent // BỎ SHADOW
            };

            txt_Username = new Guna2TextBox
            {
                Location = new Point(50, 140),
                Size = new Size(500, 45),
                PlaceholderText = "Tên đăng nhập",
                Font = new Font(new FontFamily("Segoe UI"), 11F),
                BorderRadius = 8
            };

            txt_Email = new Guna2TextBox
            {
                Location = new Point(50, 210),
                Size = new Size(500, 45),
                PlaceholderText = "Email",
                Font = new Font(new FontFamily("Segoe UI"), 11F),
                BorderRadius = 8
            };

            txt_Password = new Guna2TextBox
            {
                Location = new Point(50, 280),
                Size = new Size(500, 45),
                PlaceholderText = "Mật khẩu",
                Font = new Font(new FontFamily("Segoe UI"), 11F),
                BorderRadius = 8,
                PasswordChar = '●'
            };

            txt_Confirm_Password = new Guna2TextBox
            {
                Location = new Point(50, 350),
                Size = new Size(500, 45),
                PlaceholderText = "Xác nhận mật khẩu",
                Font = new Font(new FontFamily("Segoe UI"), 11F),
                BorderRadius = 8,
                PasswordChar = '●'
            };

            btn_Register = new Guna2Button
            {
                Text = "Đăng Ký",
                Location = new Point(50, 440),
                Size = new Size(500, 50),
                FillColor = Theme_Colors.Accent.Cyan,
                Font = new Font(new FontFamily("Segoe UI"), 12F, FontStyle.Bold),
                BorderRadius = 10
            };
            btn_Register.Click += Btn_Register_Click;

            btn_Back = new Guna2Button
            {
                Text = "Quay Lại",
                Location = new Point(50, 510),
                Size = new Size(500, 50),
                FillColor = Color.Transparent,
                ForeColor = Theme_Colors.Get_Text_Secondary(),
                Font = new Font(new FontFamily("Segoe UI"), 11F),
                BorderRadius = 10,
                BorderColor = Theme_Colors.Get_Border(),
                BorderThickness = 2
            };
            btn_Back.Click += Btn_Back_Click;

            panel_Main.Controls.AddRange(new Control[] {
                lbl_Title, txt_Username, txt_Email, txt_Password,
                txt_Confirm_Password, btn_Register, btn_Back
            });

            this.Controls.Add(panel_Main);
        }

        private void Btn_Register_Click(object? sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(txt_Username.Text) ||
                string.IsNullOrWhiteSpace(txt_Email.Text) ||
                string.IsNullOrWhiteSpace(txt_Password.Text))
            {
                MessageBox.Show("Vui lòng nhập đầy đủ thông tin!", "Thông báo",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            if (txt_Password.Text != txt_Confirm_Password.Text)
            {
                MessageBox.Show("Mật khẩu xác nhận không khớp!", "Thông báo",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            MessageBox.Show("Đăng ký thành công!", "Thông báo",
                MessageBoxButtons.OK, MessageBoxIcon.Information);
            this.Close();
        }

        private void Btn_Back_Click(object? sender, EventArgs e)
        {
            this.Close();
        }
    }
}
