// File: Views/Dashboard_View.cs

using System;
using System.Drawing;
using System.Windows.Forms;
using Guna.UI2.WinForms;
using NT106_Nhom12_Pro.Utils;
using NT106_Nhom12_Pro.Helpers;

namespace NT106_Nhom12_Pro.Views
{
    public partial class Dashboard_View : Form
    {
        public Dashboard_View()
        {
            InitializeComponent();
            Load_Dashboard_Data();
        }

        private void Load_Dashboard_Data()
        {
            // Load data giả lập
            Update_Stats();
            Load_Equipment_Status();
            Load_Recent_Activities();
        }

        private void Update_Stats()
        {
            // Update các thống kê - có thể kết nối Firebase ở đây
        }

        private void Load_Equipment_Status()
        {
            // Load trạng thái thiết bị
        }

        private void Load_Recent_Activities()
        {
            // Load hoạt động gần đây
        }

        public void Apply_Theme()
        {
            this.BackColor = Theme_Colors.Get_Background();
            // Update các controls con
        }
    }
}
