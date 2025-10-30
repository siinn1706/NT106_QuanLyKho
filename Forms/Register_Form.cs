using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Windows.Forms;
using NT106_Nhom12_Pro.Utils;
using Firebase.Auth;
using System.Threading.Tasks;

namespace NT106_Nhom12_Pro.Forms
{
    public partial class Register_Form : Form
    {
        // Khai báo controls giao diện
        private bool password_Visible = false;

        // Phương thức Register_Form
        public Register_Form()
        {
            InitializeComponent();
            Initialize_Custom_Components();
            Theme_Manager.On_Theme_Changed += Apply_Theme;
            Apply_Theme();
            this.FormClosing += Register_Form_FormClosing;
        }

        // Phương thức Register_Form_FormClosing
        private void Register_Form_FormClosing(object sender, FormClosingEventArgs e)
        {
            Theme_Manager.On_Theme_Changed -= Apply_Theme;
        }

        // Phương thức Initialize_Custom_Components
        private void Initialize_Custom_Components()
        {
            logo_Picture.Paint += Logo_Picture_Paint;
            theme_Toggle_Button.Click += Theme_Toggle_Button_Click;
            toggle_Password_Button.Click += Toggle_Password_Button_Click;
            register_Button.Click += Register_Button_Click;
            login_Link_Label.Click += Login_Link_Label_Click;

            theme_Toggle_Button.Paint += Theme_Toggle_Button_Paint;
            toggle_Password_Button.Paint += Toggle_Password_Button_Paint;

            theme_Toggle_Button.Text = "";
            toggle_Password_Button.Text = "";

            if (toggle_Password_Button.Parent != password_TextBox)
            {
                toggle_Password_Button.Parent?.Controls.Remove(toggle_Password_Button);
            }

            password_TextBox.Controls.Clear();
            password_TextBox.Controls.Add(toggle_Password_Button);
            toggle_Password_Button.BringToFront();

            toggle_Password_Button.Location = new Point(
                password_TextBox.ClientSize.Width - toggle_Password_Button.Width - 5,
                (password_TextBox.ClientSize.Height - toggle_Password_Button.Height) / 2
            );
            toggle_Password_Button.Anchor = AnchorStyles.Right | AnchorStyles.Top;

            toggle_Password_Button.BackColor = Color.Transparent;
            toggle_Password_Button.FlatStyle = FlatStyle.Flat;
            toggle_Password_Button.FlatAppearance.BorderSize = 0;
            toggle_Password_Button.FlatAppearance.MouseDownBackColor = Color.Transparent;
            toggle_Password_Button.FlatAppearance.MouseOverBackColor = Color.Transparent;
            toggle_Password_Button.TabStop = false;

            login_Link_Label.MouseEnter += (s, e) =>
            {
                login_Link_Label.ForeColor = Theme_Manager.Is_Light_Mode
                    ? Theme_Colors.Light_Mode.Link_Hover
                    : Theme_Colors.Dark_Mode.Link_Hover;
            };

            login_Link_Label.MouseLeave += (s, e) =>
            {
                login_Link_Label.ForeColor = Theme_Manager.Is_Light_Mode
                    ? Theme_Colors.Light_Mode.Link_Color
                    : Theme_Colors.Dark_Mode.Link_Color;
            };

            email_TextBox.GotFocus += (s, e) =>
            {
                if (email_TextBox.Text == "Enter your email")
                {
                    email_TextBox.Text = "";
                }
            };

            password_TextBox.Resize += (s, e) =>
            {
                toggle_Password_Button.Location = new Point(
                    password_TextBox.ClientSize.Width - toggle_Password_Button.Width - 5,
                    (password_TextBox.ClientSize.Height - toggle_Password_Button.Height) / 2
                );
            };
        }

        // Phương thức Theme_Toggle_Button_Paint
        private void Theme_Toggle_Button_Paint(object sender, PaintEventArgs e)
        {
            Button btn = sender as Button;
            if (btn == null) return;

            e.Graphics.Clear(btn.BackColor);

            Rectangle icon_Bounds = new Rectangle(6, 6, btn.Width - 12, btn.Height - 12);
            Color icon_Color = Color.White;

            if (Theme_Manager.Is_Light_Mode)
            {
                SVG_Icon_Loader.Draw_SVG_Icon(e.Graphics, icon_Bounds, "dark_mode.svg", icon_Color);
            }
            else
            {
                SVG_Icon_Loader.Draw_SVG_Icon(e.Graphics, icon_Bounds, "light_mode.svg", icon_Color);
            }
        }

        // Phương thức Toggle_Password_Button_Paint
        private void Toggle_Password_Button_Paint(object sender, PaintEventArgs e)
        {
            Button btn = sender as Button;
            if (btn == null) return;

            e.Graphics.Clear(Color.Transparent);

            if (btn.Parent is TextBox)
            {
                using (SolidBrush brush = new SolidBrush(btn.Parent.BackColor))
                {
                    e.Graphics.FillRectangle(brush, btn.ClientRectangle);
                }
            }

            Rectangle icon_Bounds = new Rectangle(4, 4, btn.Width - 8, btn.Height - 8);

            Color icon_Color = Theme_Manager.Is_Light_Mode
                ? Color.FromArgb(120, 120, 120)
                : Color.FromArgb(180, 180, 180);

            if (password_Visible)
            {
                SVG_Icon_Loader.Draw_SVG_Icon(e.Graphics, icon_Bounds, "visibility_on.svg", icon_Color);
            }
            else
            {
                SVG_Icon_Loader.Draw_SVG_Icon(e.Graphics, icon_Bounds, "visibility_off.svg", icon_Color);
            }
        }

        // Phương thức Apply_Theme
        private void Apply_Theme()
        {
            if (Theme_Manager.Is_Light_Mode)
            {
                this.BackColor = Theme_Colors.Light_Mode.Background;
                left_Panel.BackColor = Theme_Colors.Light_Mode.Background;
                logo_Label.ForeColor = Theme_Colors.Light_Mode.Text_Primary;
                welcome_Label.ForeColor = Theme_Colors.Light_Mode.Text_Primary;
                subtitle_Label.ForeColor = Theme_Colors.Light_Mode.Text_Muted;
                email_Label.ForeColor = Theme_Colors.Light_Mode.Text_Secondary;
                password_Label.ForeColor = Theme_Colors.Light_Mode.Text_Secondary;
                login_Text_Label.ForeColor = Theme_Colors.Light_Mode.Text_Muted;
                email_TextBox.BackColor = Theme_Colors.Light_Mode.Input_Background;
                email_TextBox.ForeColor = Theme_Colors.Light_Mode.Text_Primary;
                password_TextBox.BackColor = Theme_Colors.Light_Mode.Input_Background;
                password_TextBox.ForeColor = Theme_Colors.Light_Mode.Text_Primary;

                theme_Toggle_Button.BackColor = Color.FromArgb(124, 58, 237);

                login_Link_Label.ForeColor = Theme_Colors.Light_Mode.Link_Color;
            }
            else
            {
                this.BackColor = Theme_Colors.Dark_Mode.Background;
                left_Panel.BackColor = Theme_Colors.Dark_Mode.Background;
                logo_Label.ForeColor = Theme_Colors.Dark_Mode.Text_Primary;
                welcome_Label.ForeColor = Theme_Colors.Dark_Mode.Text_Primary;
                subtitle_Label.ForeColor = Theme_Colors.Dark_Mode.Text_Muted;
                email_Label.ForeColor = Theme_Colors.Dark_Mode.Text_Secondary;
                password_Label.ForeColor = Theme_Colors.Dark_Mode.Text_Secondary;
                login_Text_Label.ForeColor = Theme_Colors.Dark_Mode.Text_Muted;
                email_TextBox.BackColor = Theme_Colors.Dark_Mode.Input_Background;
                email_TextBox.ForeColor = Theme_Colors.Dark_Mode.Text_Primary;
                password_TextBox.BackColor = Theme_Colors.Dark_Mode.Input_Background;
                password_TextBox.ForeColor = Theme_Colors.Dark_Mode.Text_Primary;

                theme_Toggle_Button.BackColor = Color.FromArgb(147, 51, 234);

                login_Link_Label.ForeColor = Theme_Colors.Dark_Mode.Link_Color;
            }

            theme_Toggle_Button.Invalidate();
            toggle_Password_Button.Invalidate();
logo_Picture.Invalidate();

            this.Invalidate(true);
        }

        // Phương thức Theme_Toggle_Button_Click
        private void Theme_Toggle_Button_Click(object sender, EventArgs e)
        {
            Theme_Manager.Toggle_Theme();
        }

        // Phương thức Logo_Picture_Paint
        private void Logo_Picture_Paint(object sender, PaintEventArgs e)
        {
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            e.Graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            e.Graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;

            try
            {
                string base_Path = AppDomain.CurrentDomain.BaseDirectory;
                string logo_Path = Path.Combine(base_Path, "Resources", "images", "logo.png");

                if (!File.Exists(logo_Path))
                {
                    logo_Path = Path.Combine(base_Path, "..", "..", "Resources", "images", "logo.png");
                    logo_Path = Path.GetFullPath(logo_Path);
                }

                System.Diagnostics.Debug.WriteLine($"Logo path: {logo_Path}");
                System.Diagnostics.Debug.WriteLine($"Logo exists: {File.Exists(logo_Path)}");

                if (File.Exists(logo_Path))
                {
                    using (Image logo = Image.FromFile(logo_Path))
                    {
                        int corner_Radius = 12;
                        using (GraphicsPath clip_Path = new GraphicsPath())
                        {
                            int x = 0;
                            int y = 0;
                            int width = logo_Picture.Width;
                            int height = logo_Picture.Height;
                            int diameter = corner_Radius * 2;

                            clip_Path.AddArc(x, y, diameter, diameter, 180, 90);
                            clip_Path.AddArc(x + width - diameter, y, diameter, diameter, 270, 90);
                            clip_Path.AddArc(x + width - diameter, y + height - diameter, diameter, diameter, 0, 90);
                            clip_Path.AddArc(x, y + height - diameter, diameter, diameter, 90, 90);
                            clip_Path.CloseFigure();

                            e.Graphics.SetClip(clip_Path);
                            e.Graphics.DrawImage(logo, 0, 0, logo_Picture.Width, logo_Picture.Height);
                            e.Graphics.ResetClip();
                        }
                        return;
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error loading logo: {ex.Message}");
            }

            Draw_Default_Logo(e.Graphics);
        }

        // Phương thức Draw_Default_Logo
        private void Draw_Default_Logo(Graphics g)
        {
            int corner_Radius = 12;
            using (GraphicsPath path = new GraphicsPath())
            {
                int x = 0;
                int y = 0;
                int width = logo_Picture.Width;
                int height = logo_Picture.Height;
                int diameter = corner_Radius * 2;

                path.AddArc(x, y, diameter, diameter, 180, 90);
                path.AddArc(x + width - diameter, y, diameter, diameter, 270, 90);
                path.AddArc(x + width - diameter, y + height - diameter, diameter, diameter, 0, 90);
                path.AddArc(x, y + height - diameter, diameter, diameter, 90, 90);
                path.CloseFigure();

                using (LinearGradientBrush brush = new LinearGradientBrush(
                    logo_Picture.ClientRectangle,
                    Color.FromArgb(147, 51, 234),
                    Color.FromArgb(124, 58, 237),
                    45f))
                {
                    g.FillPath(brush, path);
                }
            }

            using (System.Drawing.Font font = new System.Drawing.Font("Segoe UI", 32, FontStyle.Bold))
            {
                SizeF text_Size = g.MeasureString("N", font);
                float x = (logo_Picture.Width - text_Size.Width) / 2;
                float y = (logo_Picture.Height - text_Size.Height) / 2;
                g.DrawString("N", font, Brushes.White, x, y);
            }
        }

        // Phương thức Toggle_Password_Button_Click
        private void Toggle_Password_Button_Click(object sender, EventArgs e)
        {
            password_Visible = !password_Visible;
            password_TextBox.UseSystemPasswordChar = !password_Visible;
            toggle_Password_Button.Invalidate();
        }

        // Phương thức Register_Button_Click
        private async void Register_Button_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(email_TextBox.Text) || email_TextBox.Text == "Enter your email")
            {
                MessageBox.Show("Please enter your email address", "Validation",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            if (string.IsNullOrWhiteSpace(password_TextBox.Text))
            {
                MessageBox.Show("Please enter your password", "Validation",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            try
            {
                // Hiển thị con trỏ chuột "đang chờ"
                this.Cursor = Cursors.WaitCursor;

                // Khởi tạo trình xác thực Firebase
                var authClient = new FirebaseAuthClient(new Firebase.Auth.FirebaseAuthConfig()
                {
                    ApiKey = NT106_Nhom12_Pro.Utils.FirebaseConfig.apiKey,
                    AuthDomain = NT106_Nhom12_Pro.Utils.FirebaseConfig.authDomain
                });

                // Đăng ký người dùng mới bằng Email và Mật khẩu
                var createUser = await authClient.CreateUserWithEmailAndPasswordAsync(
                    email_TextBox.Text.Trim(),
                    password_TextBox.Text
                );

                // ĐĂNG KÝ THÀNH CÔNG!
                MessageBox.Show("Đăng ký thành công! Bạn có thể đăng nhập ngay.", "Thành công",
                    MessageBoxButtons.OK, MessageBoxIcon.Information);

                // xóa dữ liệu đầu vào
                email_TextBox.Text = "";
                password_TextBox.Text = "";

                // điều hướng đến form đăng nhập (bỏ comment nếu muốn)
                this.Hide();
                var login_Form = new Login_Form();
                login_Form.FormClosed += (s, args) => this.Close();
                login_Form.Show();
            }
            catch (FirebaseAuthException fex)
            {
                // FirebaseAuthException có thể chứa thông tin chi tiết; hiển thị thông báo lỗi
                MessageBox.Show($"Đăng ký thất bại: {fex.Message}", "Lỗi đăng ký",
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            catch (Exception ex)
            {
                // Xử lý chung cho các lỗi không mong muốn
                MessageBox.Show($"Đã xảy ra lỗi không mong muốn: {ex.Message}", "Lỗi",
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                // Luôn luôn đặt lại con trỏ chuột
                this.Cursor = Cursors.Default;
            }
        }

        // Phương thức Login_Link_Label_Click
        private void Login_Link_Label_Click(object sender, EventArgs e)
        {
            this.Hide();
            Login_Form login_Form = new Login_Form();
            login_Form.FormClosed += (s, args) => this.Close();
            login_Form.Show();
        }
    }
}
