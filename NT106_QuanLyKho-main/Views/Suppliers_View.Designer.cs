// File: Views/Suppliers_View.Designer.cs

using System;
using System.Drawing;
using System.Windows.Forms;
using NT106_Nhom12_Pro.Utils;

namespace NT106_Nhom12_Pro.Views
{
    partial class Suppliers_View
    {
        private System.ComponentModel.IContainer components = null;
        private Label lbl_Title;

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
            this.BackColor = Theme_Colors.Get_Background();
            this.ClientSize = new Size(1130, 750);
            this.FormBorderStyle = FormBorderStyle.None;

            lbl_Title = new Label
            {
                Text = "Quản Lý Nhà Cung Cấp",
                Font = new Font("Segoe UI", 18F, FontStyle.Bold),
                ForeColor = Theme_Colors.Get_Text_Primary(),
                Location = new Point(20, 20),
                AutoSize = true
            };

            this.Controls.Add(lbl_Title);
        }
    }
}
