using System;
using System.Drawing;
using System.Windows.Forms;
using Guna.UI2.WinForms;
using NT106_Nhom12_Pro.Helpers;
using NT106_Nhom12_Pro.Utils;

namespace NT106_Nhom12_Pro.Forms
{
    public partial class ChangePassword_Form : Form
    {
        private Guna2Panel panel_Main = null!;
        private Label lbl_Title = null!;
        private Label lbl_Info = null!;
        private Guna2TextBox txt_CurrentPassword = null!;
        private Guna2TextBox txt_NewPassword = null!;
        private Guna2TextBox txt_ConfirmPassword = null!;
        private Guna2Button btn_ChangePassword = null!;
        private Guna2Button btn_Cancel = null!;
        private Guna2CheckBox chk_ShowPassword = null!;

        public ChangePassword_Form()
        {
            InitializeComponent();
        }
    }
}
