// File: Forms/Main_Form.cs

#nullable enable

using System;
using System.Drawing;
using System.Windows.Forms;
using Guna.UI2.WinForms;
using NT106_Nhom12_Pro.Components;
using NT106_Nhom12_Pro.Utils;
using NT106_Nhom12_Pro.Views;

namespace NT106_Nhom12_Pro.Forms
{
    public partial class Main_Form : Form
    {
        private Nav_Button? _activeButton;
        private Form? _activeView;

        public Main_Form()
        {
            InitializeComponent();
            Load_View(new Dashboard_View());
            btn_Dashboard.Is_Active = true;
            _activeButton = btn_Dashboard;
        }

        private void Load_View(Form view)
        {
            // Clear old view
            if (_activeView != null)
            {
                panel_Content.Controls.Remove(_activeView);
                _activeView.Close();
                _activeView.Dispose();
            }

            // Load new view
            _activeView = view;
            view.TopLevel = false;
            view.FormBorderStyle = FormBorderStyle.None;
            view.Dock = DockStyle.Fill;
            panel_Content.Controls.Add(view);
            view.Show();
        }

        private void Activate_Button(Nav_Button button)
        {
            if (_activeButton != null)
            {
                _activeButton.Is_Active = false;
            }

            button.Is_Active = true;
            _activeButton = button;
        }
    }
}
