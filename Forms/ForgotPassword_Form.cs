using Guna.UI2.WinForms;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Text.RegularExpressions;
using System.Windows.Forms;
using Guna.UI2.WinForms;
using NT106_Nhom12_Pro.Helpers;
using NT106_Nhom12_Pro.Utils;

namespace NT106_Nhom12_Pro.Forms
{
    public partial class ForgotPassword_Form : Form
    {
        private Guna2Panel panel_Main = null!;
        private Label lbl_Title = null!;
        private Label lbl_Description = null!;
        private Guna2TextBox txt_Email = null!;
        private Guna2Button btn_SendReset = null!;
        private Guna2Button btn_Cancel = null!;

        public ForgotPassword_Form()
        {
            InitializeComponent();
        }

        private async void Btn_SendReset_Click(object sender, EventArgs e)
        {
            if(string.IsNullOrWhiteSpace(txt_Email.Text))
            {
                MessageBox.Show("Vui lòng nhập email!", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txt_Email.Focus();
                return;
            }  
            if(!IsValidEmail(txt_Email.Text))
            {
                MessageBox.Show("Email không hợp lệ!", "Thông báo",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txt_Email.Focus();
                return;
            }

            btn_SendReset.Enabled = false;
            btn_Cancel.Enabled = false;
            btn_SendReset.Text = "Đang gửi...";
            this.Cursor = Cursors.WaitCursor;

            try
            {
                await FirebaseAuthHelper.ForgotPasswordAsync(txt_Email.Text.Trim());
                MessageBox.Show(
                    "Email đặt lại mật khẩu đã được gửi!\n\n" +
                    "Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn.\n" +
                    "Nếu không thấy email, hãy kiểm tra trong mục Spam.",
                    "Thành công",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
                this.DialogResult = DialogResult.OK;
                this.Close();
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, "Lỗi",
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
                txt_Email.Focus();
            }
            finally
            {
                btn_SendReset.Enabled = true;
                btn_Cancel.Enabled = true;
                btn_SendReset.Text = "Gửi Email Đặt Lại";
                this.Cursor = Cursors.Default;
            }
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var regex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$");
                return regex.IsMatch(email);
            }
            catch
            {
                return false;
            }
        }
    }
}
