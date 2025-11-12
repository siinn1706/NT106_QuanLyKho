// File: Components/Nav_Button.cs

#nullable enable

using System;
using System.Drawing;
using System.Windows.Forms;
using FontAwesome.Sharp;
using NT106_Nhom12_Pro.Utils;

namespace NT106_Nhom12_Pro.Components
{
    public class Nav_Button : IconButton
    {
        private bool _isActive = false;
        private Panel? _borderPanel;

        public Nav_Button()
        {
            // Thiết lập style cho button
            this.FlatStyle = FlatStyle.Flat;
            this.FlatAppearance.BorderSize = 0;
            this.TextAlign = ContentAlignment.MiddleLeft;
            this.ImageAlign = ContentAlignment.MiddleLeft;
            this.Dock = DockStyle.Top;
            this.Height = 55;
            this.IconSize = 22;
            this.IconChar = IconChar.None;
            this.TextImageRelation = TextImageRelation.ImageBeforeText;
            this.Padding = new Padding(10, 0, 0, 0);
            this.BackColor = Color.Transparent;
            this.ForeColor = Theme_Colors.Sidebar.TextInactive;
            this.IconColor = Theme_Colors.Sidebar.TextInactive;
            this.Font = new Font(new FontFamily("Segoe UI"), 10.5F, FontStyle.Regular);
            this.Cursor = Cursors.Hand;

            // Hover effect
            this.MouseEnter += Nav_Button_MouseEnter;
            this.MouseLeave += Nav_Button_MouseLeave;
            this.Click += Nav_Button_Click;
        }

        public bool Is_Active
        {
            get => _isActive;
            set
            {
                _isActive = value;
                Update_Style();
            }
        }

        public void Set_Border_Panel(Panel borderPanel)
        {
            _borderPanel = borderPanel;
        }

        private void Nav_Button_Click(object? sender, EventArgs e)
        {
            // Handled by parent form
        }

        private void Update_Style()
        {
            if (_isActive)
            {
                this.BackColor = Theme_Colors.Sidebar.Hover;
                this.ForeColor = Theme_Colors.Sidebar.TextActive;
                this.IconColor = Theme_Colors.Sidebar.TextActive;
                Show_Border();
            }
            else
            {
                this.BackColor = Color.Transparent;
                this.ForeColor = Theme_Colors.Sidebar.TextInactive;
                this.IconColor = Theme_Colors.Sidebar.TextInactive;
                Hide_Border();
            }
        }

        private void Show_Border()
        {
            if (_borderPanel != null)
            {
                _borderPanel.BackColor = Theme_Colors.Sidebar.ActiveBorder;
                _borderPanel.Size = new Size(4, this.Height);
                _borderPanel.Location = new Point(0, this.Top);
                _borderPanel.Visible = true;
                _borderPanel.BringToFront();
            }
        }

        private void Hide_Border()
        {
            if (_borderPanel != null && !_isActive)
            {
                _borderPanel.Visible = false;
            }
        }

        private void Nav_Button_MouseEnter(object? sender, EventArgs e)
        {
            if (!_isActive)
            {
                this.BackColor = Color.FromArgb(40, Theme_Colors.Sidebar.Hover);
            }
        }

        private void Nav_Button_MouseLeave(object? sender, EventArgs e)
        {
            if (!_isActive)
            {
                this.BackColor = Color.Transparent;
            }
        }
    }
}
