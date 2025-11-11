// File: Components/Product_Dialog.cs

#nullable enable

using System;
using System.Drawing;
using System.Windows.Forms;
using Guna.UI2.WinForms;
using NT106_Nhom12_Pro.Utils;

namespace NT106_Nhom12_Pro.Components
{
    public class Product_Dialog : Form
    {
        private Guna2Panel panel_Main = null!;
        private Label lbl_Title = null!;
        private Guna2TextBox txt_Product_Name = null!;
        private Guna2TextBox txt_Product_Code = null!;
        private Guna2NumericUpDown num_Quantity = null!;
        private Guna2Button btn_Save = null!;
        private Guna2Button btn_Cancel = null!;

        public string Product_Name { get; private set; } = string.Empty;
        public string Product_Code { get; private set; } = string.Empty;
        public int Quantity { get; private set; } = 0;

        public Product_Dialog()
        {
            InitializeComponent();
            Apply_Theme();
        }

        private void InitializeComponent()
        {
            // Form settings
            this.Text = "N3T - Thêm Sản Phẩm";
            this.Size = new Size(500, 450);
            this.StartPosition = FormStartPosition.CenterParent;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;

            // Main panel
            panel_Main = new Guna2Panel
            {
                Dock = DockStyle.Fill,
                Padding = new Padding(30),
                BorderRadius = 0
            };

            // Title
            lbl_Title = new Label
            {
                Text = "Nhập Thông Tin Sản Phẩm Kho",
                Font = new Font("Segoe UI", 16F, FontStyle.Bold),
                AutoSize = true,
                Location = new Point(30, 30)
            };

            // Product Name
            Label lbl_Name = new Label
            {
                Text = "Tên Sản Phẩm:",
                Font = new Font("Segoe UI", 10F),
                Location = new Point(30, 90),
                AutoSize = true
            };

            txt_Product_Name = new Guna2TextBox
            {
                Location = new Point(30, 115),
                Size = new Size(420, 40),
                Font = new Font("Segoe UI", 10F),
                BorderRadius = 8,
                PlaceholderText = "Nhập tên sản phẩm..."
            };

            // Product Code
            Label lbl_Code = new Label
            {
                Text = "Mã Sản Phẩm:",
                Font = new Font("Segoe UI", 10F),
                Location = new Point(30, 175),
                AutoSize = true
            };

            txt_Product_Code = new Guna2TextBox
            {
                Location = new Point(30, 200),
                Size = new Size(420, 40),
                Font = new Font("Segoe UI", 10F),
                BorderRadius = 8,
                PlaceholderText = "Nhập mã sản phẩm..."
            };

            // Quantity
            Label lbl_Quantity = new Label
            {
                Text = "Số Lượng:",
                Font = new Font("Segoe UI", 10F),
                Location = new Point(30, 260),
                AutoSize = true
            };

            num_Quantity = new Guna2NumericUpDown
            {
                Location = new Point(30, 285),
                Size = new Size(420, 40),
                Font = new Font("Segoe UI", 10F),
                BorderRadius = 8,
                Minimum = 1,
                Maximum = 10000,
                Value = 1
            };

            // Buttons
            btn_Cancel = new Guna2Button
            {
                Text = "Hủy",
                Location = new Point(250, 355),
                Size = new Size(95, 42),
                FillColor = Color.FromArgb(148, 163, 184),
                Font = new Font("Segoe UI", 10F, FontStyle.Bold),
                BorderRadius = 8
            };
            btn_Cancel.Click += Btn_Cancel_Click;

            btn_Save = new Guna2Button
            {
                Text = "Lưu",
                Location = new Point(355, 355),
                Size = new Size(95, 42),
                FillColor = Theme_Colors.Accent.Cyan,
                Font = new Font("Segoe UI", 10F, FontStyle.Bold),
                BorderRadius = 8
            };
            btn_Save.Click += Btn_Save_Click;

            // Add controls
            panel_Main.Controls.AddRange(new Control[] {
                lbl_Title, lbl_Name, txt_Product_Name,
                lbl_Code, txt_Product_Code,
                lbl_Quantity, num_Quantity,
                btn_Save, btn_Cancel
            });

            this.Controls.Add(panel_Main);
        }

        private void Apply_Theme()
        {
            this.BackColor = Theme_Colors.Get_Card_Background();
            panel_Main.FillColor = Theme_Colors.Get_Card_Background();
            lbl_Title.ForeColor = Theme_Colors.Get_Text_Primary();
        }

        private void Btn_Save_Click(object? sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(txt_Product_Name.Text))
            {
                MessageBox.Show("Vui lòng nhập tên sản phẩm!", "Thông báo",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            Product_Name = txt_Product_Name.Text;
            Product_Code = txt_Product_Code.Text;
            Quantity = (int)num_Quantity.Value;
            this.DialogResult = DialogResult.OK;
            this.Close();
        }

        private void Btn_Cancel_Click(object? sender, EventArgs e)
        {
            this.DialogResult = DialogResult.Cancel;
            this.Close();
        }
    }
}
