// File: Forms/Main_Form.Designer.cs

#nullable enable

using System;
using System.Drawing;
using System.Windows.Forms;
using Guna.UI2.WinForms;
using FontAwesome.Sharp;
using NT106_Nhom12_Pro.Components;
using NT106_Nhom12_Pro.Utils;
using NT106_Nhom12_Pro.Views;

namespace NT106_Nhom12_Pro.Forms
{
    partial class Main_Form
    {
        private System.ComponentModel.IContainer? components = null;
        private Guna2Panel panel_Main = null!;
        private Guna2Panel panel_Sidebar = null!;
        private Guna2Panel panel_Top = null!;
        private Guna2Panel panel_Content = null!;
        private Panel panel_Active_Border = null!;
        private Nav_Button btn_Dashboard = null!;
        private Nav_Button btn_Inventory = null!;
        private Nav_Button btn_Inbound = null!;
        private Nav_Button btn_Outbound = null!;
        private Nav_Button btn_Products = null!;
        private Nav_Button btn_Suppliers = null!;
        private Nav_Button btn_Settings = null!;
        private Label lbl_Title = null!;
        private Guna2CirclePictureBox pic_User = null!;

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
            this.ClientSize = new Size(1400, 850);
            this.MinimumSize = new Size(1200, 700);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.Text = "N3T - Quản Lý Kho | Trang Chủ"; // Đổi Dashboard → Trang Chủ
            this.BackColor = Theme_Colors.Light.Background;
            this.Icon = SystemIcons.Application;

            // Main Panel
            panel_Main = new Guna2Panel
            {
                Dock = DockStyle.Fill,
                FillColor = Theme_Colors.Light.Background
            };

            // Sidebar Panel
            panel_Sidebar = new Guna2Panel
            {
                Dock = DockStyle.Left,
                Width = 250,
                FillColor = Theme_Colors.Sidebar.Background,
                Padding = new Padding(0, 20, 0, 20)
            };

            // Logo/Brand
            var lbl_Brand = new Label
            {
                Text = "N3T",
                Font = new Font(new FontFamily("Segoe UI"), 24F, FontStyle.Bold),
                ForeColor = Color.White,
                AutoSize = false,
                Size = new Size(250, 50),
                TextAlign = ContentAlignment.MiddleCenter,
                Location = new Point(0, 20),
                BackColor = Color.Transparent
            };

            var lbl_Brand_Sub = new Label
            {
                Text = "Quản Lý Kho",
                Font = new Font(new FontFamily("Segoe UI"), 10F),
                ForeColor = Theme_Colors.Sidebar.TextInactive,
                AutoSize = false,
                Size = new Size(250, 25),
                TextAlign = ContentAlignment.MiddleCenter,
                Location = new Point(0, 70),
                BackColor = Color.Transparent
            };

            // Active Border Indicator
            panel_Active_Border = new Panel
            {
                Size = new Size(4, 55),
                BackColor = Theme_Colors.Sidebar.ActiveBorder,
                Visible = false
            };

            // Navigation Buttons - VIỆT HÓA
            btn_Dashboard = Create_Nav_Button("  Trang Chủ", IconChar.Home); // Dashboard → Trang Chủ
            btn_Dashboard.Click += (s, e) =>
            {
                Activate_Button(btn_Dashboard);
                Load_View(new Dashboard_View());
                lbl_Title.Text = "Trang Chủ"; // Dashboard → Trang Chủ
            };

            btn_Inventory = Create_Nav_Button("  Tồn Kho", IconChar.BoxesStacked);
            btn_Inventory.Click += (s, e) =>
            {
                Activate_Button(btn_Inventory);
                Load_View(new Inventory_View());
                lbl_Title.Text = "Tồn Kho";
            };

            btn_Inbound = Create_Nav_Button("  Nhập Kho", IconChar.ArrowDown);
            btn_Inbound.Click += (s, e) =>
            {
                Activate_Button(btn_Inbound);
                Load_View(new Inbound_View());
                lbl_Title.Text = "Nhập Kho";
            };

            btn_Outbound = Create_Nav_Button("  Xuất Kho", IconChar.ArrowUp);
            btn_Outbound.Click += (s, e) =>
            {
                Activate_Button(btn_Outbound);
                Load_View(new Outbound_View());
                lbl_Title.Text = "Xuất Kho";
            };

            btn_Products = Create_Nav_Button("  Sản Phẩm", IconChar.Box);
            btn_Products.Click += (s, e) =>
            {
                Activate_Button(btn_Products);
                Load_View(new Products_View());
                lbl_Title.Text = "Sản Phẩm";
            };

            btn_Suppliers = Create_Nav_Button("  Nhà Cung Cấp", IconChar.Users);
            btn_Suppliers.Click += (s, e) =>
            {
                Activate_Button(btn_Suppliers);
                Load_View(new Suppliers_View());
                lbl_Title.Text = "Nhà Cung Cấp";
            };

            // Spacer
            var spacer = new Panel
            {
                Dock = DockStyle.Top,
                Height = 80,
                BackColor = Color.Transparent
            };

            btn_Settings = Create_Nav_Button("  Cài Đặt", IconChar.Gear);
            btn_Settings.Dock = DockStyle.Bottom;
            btn_Settings.Click += (s, e) =>
            {
                Activate_Button(btn_Settings);
                Load_View(new Settings_View());
                lbl_Title.Text = "Cài Đặt";
            };

            // Set border panel
            btn_Dashboard.Set_Border_Panel(panel_Active_Border);
            btn_Inventory.Set_Border_Panel(panel_Active_Border);
            btn_Inbound.Set_Border_Panel(panel_Active_Border);
            btn_Outbound.Set_Border_Panel(panel_Active_Border);
            btn_Products.Set_Border_Panel(panel_Active_Border);
            btn_Suppliers.Set_Border_Panel(panel_Active_Border);
            btn_Settings.Set_Border_Panel(panel_Active_Border);

            // Add buttons to sidebar
            panel_Sidebar.Controls.Add(btn_Settings);
            panel_Sidebar.Controls.Add(spacer);
            panel_Sidebar.Controls.Add(btn_Suppliers);
            panel_Sidebar.Controls.Add(btn_Products);
            panel_Sidebar.Controls.Add(btn_Outbound);
            panel_Sidebar.Controls.Add(btn_Inbound);
            panel_Sidebar.Controls.Add(btn_Inventory);
            panel_Sidebar.Controls.Add(btn_Dashboard);
            panel_Sidebar.Controls.Add(lbl_Brand_Sub);
            panel_Sidebar.Controls.Add(lbl_Brand);
            panel_Sidebar.Controls.Add(panel_Active_Border);

            // Top Panel
            panel_Top = new Guna2Panel
            {
                Dock = DockStyle.Top,
                Height = 70,
                FillColor = Color.White
            };

            lbl_Title = new Label
            {
                Text = "Trang Chủ", // Dashboard → Trang Chủ
                Font = new Font(new FontFamily("Segoe UI"), 20F, FontStyle.Bold),
                ForeColor = Theme_Colors.Light.TextPrimary,
                AutoSize = true,
                Location = new Point(30, 20),
                BackColor = Color.Transparent
            };

            // User Avatar
            pic_User = new Guna2CirclePictureBox
            {
                Size = new Size(45, 45),
                Location = new Point(1065, 12),
                Anchor = AnchorStyles.Top | AnchorStyles.Right,
                SizeMode = PictureBoxSizeMode.Zoom,
                BackColor = Theme_Colors.Accent.Cyan,
                Cursor = Cursors.Hand
            };
            pic_User.Click += (s, e) =>
            {
                MessageBox.Show("Tính năng hồ sơ đang được phát triển!", "Thông báo",
                    MessageBoxButtons.OK, MessageBoxIcon.Information);
            };

            panel_Top.Controls.AddRange(new Control[] { lbl_Title, pic_User });

            // Content Panel
            panel_Content = new Guna2Panel
            {
                Dock = DockStyle.Fill,
                FillColor = Theme_Colors.Light.Background,
                Padding = new Padding(20),
                AutoScroll = true
            };

            // Assemble
            panel_Main.Controls.Add(panel_Content);
            panel_Main.Controls.Add(panel_Top);
            panel_Main.Controls.Add(panel_Sidebar);

            this.Controls.Add(panel_Main);
        }

        private Nav_Button Create_Nav_Button(string text, IconChar icon)
        {
            var btn = new Nav_Button
            {
                Text = text,
                IconChar = icon,
                IconSize = 22,
                IconColor = Theme_Colors.Sidebar.TextInactive
            };
            return btn;
        }
    }
}
