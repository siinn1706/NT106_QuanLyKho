// File: Forms/Login_Form.cs

#nullable enable

using System;
using System.Drawing;
using System.Windows.Forms;
using Guna.UI2.WinForms;
using NT106_Nhom12_Pro.Utils;
using NT106_Nhom12_Pro.Helpers;

namespace NT106_Nhom12_Pro.Forms
{
    public partial class Login_Form : Form
    {
        public static string? CurrentUserID { get; set; }
        public static string? CurrentUserEmail { get; set; }
        public static string? CurrentUserToken { get; set; }
        public static string? CurrentUserRefreshToken { get; set; }

        public Login_Form()
        {
            InitializeComponent();
            // BỎ LUÔN FormClosing event - không cần confirm
            txt_Password.KeyPress += TxT_Password_KeyPress;
        }

        private void TxT_Password_KeyPress(object sender, KeyPressEventArgs e)
        {
            if(e.KeyChar == (char)Keys.Enter)
            {
                Btn_Login_Click(sender, e);
                e.Handled = true;
            }
        }
    }
}
