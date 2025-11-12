using Guna.UI2.WinForms;
using NT106_Nhom12_Pro.Utils;
using System.Drawing;
using System.Windows.Forms;

namespace NT106_Nhom12_Pro.Forms
{
    partial class ForgotPassword_Form
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

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.Size = new Size(600, 450);
            this.StartPosition = FormStartPosition.CenterParent;
            this.Text = "N3T - Quên Mật Khẩu";
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
                Text = "Khôi Phục Mật Khẩu",
                Font = new Font("Segoe UI", 26F, FontStyle.Bold),
                ForeColor = Theme_Colors.Get_Text_Primary(),
                Location = new Point(50, 50),
                AutoSize = true,
                BackColor = Color.Transparent
            };

            lbl_Description = new Label
            {
                Text = "Nhập email đã đăng ký để nhận link đặt lại mật khẩu.\nEmail sẽ được gửi trong vài phút.",
                Font = new Font("Segoe UI", 10F),
                ForeColor = Theme_Colors.Get_Text_Secondary(),
                Location = new Point(50, 120),
                Size = new Size(500, 50),
                BackColor = Color.Transparent
            };

            txt_Email = new Guna2TextBox
            {
                Location = new Point(50, 190),
                Size = new Size(500, 45),
                PlaceholderText = "Email đã đăng ký",
                Font = new Font("Segoe UI", 11F),
                BorderRadius = 8,
                BorderColor = Theme_Colors.Get_Border()
            };

            btn_SendReset = new Guna2Button
            {
                Text = "Gửi Email Đặt Lại",
                Location = new Point(50, 260),
                Size = new Size(500, 50),
                FillColor = Theme_Colors.Accent.Cyan,
                Font = new Font("Segoe UI", 12F, FontStyle.Bold),
                BorderRadius = 10
            };
            btn_SendReset.Click += Btn_SendReset_Click;

            btn_Cancel = new Guna2Button
            {
                Text = "Hủy",
                Location = new Point(50, 330),
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
                lbl_Title, lbl_Description, txt_Email, btn_SendReset, btn_Cancel
            });

            this.Controls.Add(panel_Main);
        }

        #endregion
    }
}