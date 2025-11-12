// File: Program.cs

using System;
using System.Windows.Forms;

namespace NT106_Nhom12_Pro
{
    internal static class Program
    {
        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.SetHighDpiMode(HighDpiMode.SystemAware);

            // Khởi động với Login Form
            Application.Run(new Forms.Login_Form());
        }
    }
}
