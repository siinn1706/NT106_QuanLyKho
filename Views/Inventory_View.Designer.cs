// File: Views/Inventory_View.Designer.cs

using System;
using System.Drawing;
using System.Windows.Forms;
using Guna.UI2.WinForms;
using NT106_Nhom12_Pro.Utils;

namespace NT106_Nhom12_Pro.Views
{
    partial class Inventory_View
    {
        private System.ComponentModel.IContainer components = null;
        private Label lbl_Title;
        private Guna2DataGridView dgv_Inventory;
        private Guna2TextBox txt_Search;
        private Guna2Button btn_Add;
        private Guna2Button btn_Export;

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
            this.BackColor = Theme_Colors.Get_Background();
            this.ClientSize = new Size(1130, 750);
            this.FormBorderStyle = FormBorderStyle.None;

            lbl_Title = new Label
            {
                Text = "Quản Lý Tồn Kho",
                Font = new Font("Segoe UI", 18F, FontStyle.Bold),
                ForeColor = Theme_Colors.Get_Text_Primary(),
                Location = new Point(20, 20),
                AutoSize = true
            };

            txt_Search = new Guna2TextBox
            {
                Location = new Point(20, 70),
                Size = new Size(400, 42),
                PlaceholderText = "Tìm kiếm sản phẩm...",
                BorderRadius = 8,
                IconLeft = Properties.Resources.icon_search
            };

            btn_Add = new Guna2Button
            {
                Text = "Thêm Sản Phẩm",
                Location = new Point(850, 70),
                Size = new Size(130, 42),
                FillColor = Theme_Colors.Accent.Cyan,
                BorderRadius = 8,
                Font = new Font("Segoe UI", 10F, FontStyle.Bold)
            };

            btn_Export = new Guna2Button
            {
                Text = "Xuất Excel",
                Location = new Point(1000, 70),
                Size = new Size(110, 42),
                FillColor = Theme_Colors.Accent.Green,
                BorderRadius = 8,
                Font = new Font("Segoe UI", 10F, FontStyle.Bold)
            };

            dgv_Inventory = new Guna2DataGridView
            {
                Location = new Point(20, 130),
                Size = new Size(1090, 600),
                BackgroundColor = Theme_Colors.Get_Card_Background(),
                BorderStyle = BorderStyle.None,
                AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill
            };

            dgv_Inventory.Columns.AddRange(new DataGridViewColumn[]
            {
                new DataGridViewTextBoxColumn { HeaderText = "Mã SP", Name = "col_Code" },
                new DataGridViewTextBoxColumn { HeaderText = "Tên Sản Phẩm", Name = "col_Name" },
                new DataGridViewTextBoxColumn { HeaderText = "Danh Mục", Name = "col_Category" },
                new DataGridViewTextBoxColumn { HeaderText = "Số Lượng", Name = "col_Quantity" },
                new DataGridViewTextBoxColumn { HeaderText = "Đơn Vị", Name = "col_Unit" },
                new DataGridViewTextBoxColumn { HeaderText = "Giá", Name = "col_Price" }
            });

            this.Controls.AddRange(new Control[] {
                lbl_Title, txt_Search, btn_Add, btn_Export, dgv_Inventory
            });
        }

        private static class Properties
        {
            public static class Resources
            {
                public static Image icon_search => Create_Icon();
                private static Image Create_Icon()
                {
                    var bmp = new Bitmap(20, 20);
                    using (var g = Graphics.FromImage(bmp))
                    {
                        g.Clear(Color.Transparent);
                        g.DrawEllipse(new Pen(Color.Gray, 2), 2, 2, 12, 12);
                        g.DrawLine(new Pen(Color.Gray, 2), 12, 12, 18, 18);
                    }
                    return bmp;
                }
            }
        }
    }
}
