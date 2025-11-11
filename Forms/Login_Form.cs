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
        public Login_Form()
        {
            InitializeComponent();
            // BỎ LUÔN FormClosing event - không cần confirm
        }
    }
}
