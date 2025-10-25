using System;
using System.Windows.Forms;
using NT106_Nhom12_Pro.Forms;

namespace NT106_Nhom12_Pro
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new LoginForm());
        }
    }
}
