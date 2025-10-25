namespace NT106_Nhom12_Pro.Forms
{
    partial class LoginForm
    {
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.Panel leftPanel;
        private System.Windows.Forms.PictureBox logoPicture;
        private System.Windows.Forms.Label logoLabel;
        private System.Windows.Forms.Label welcomeLabel;
        private System.Windows.Forms.Label subtitleLabel;
        private System.Windows.Forms.Label emailLabel;
        private System.Windows.Forms.Label passwordLabel;
        private System.Windows.Forms.TextBox emailTextBox;
        private System.Windows.Forms.TextBox passwordTextBox;
        private System.Windows.Forms.Button togglePasswordButton;
        private System.Windows.Forms.Button loginButton;
        private System.Windows.Forms.Label registerTextLabel;
        private System.Windows.Forms.Label registerLinkLabel;
        private System.Windows.Forms.Button themeToggleButton;
        private NT106_Nhom12_Pro.Utils.CarouselPanel carouselPanel;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            leftPanel = new Panel();
            registerTextLabel = new Label();
            registerLinkLabel = new Label();
            loginButton = new Button();
            togglePasswordButton = new Button();
            passwordTextBox = new TextBox();
            passwordLabel = new Label();
            emailTextBox = new TextBox();
            emailLabel = new Label();
            subtitleLabel = new Label();
            welcomeLabel = new Label();
            logoLabel = new Label();
            logoPicture = new PictureBox();
            themeToggleButton = new Button();
            carouselPanel = new NT106_Nhom12_Pro.Utils.CarouselPanel();
            leftPanel.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)logoPicture).BeginInit();
            SuspendLayout();
            // 
            // leftPanel
            // 
            leftPanel.BackColor = Color.White;
            leftPanel.Controls.Add(registerTextLabel);
            leftPanel.Controls.Add(registerLinkLabel);
            leftPanel.Controls.Add(loginButton);
            leftPanel.Controls.Add(togglePasswordButton);
            leftPanel.Controls.Add(passwordTextBox);
            leftPanel.Controls.Add(passwordLabel);
            leftPanel.Controls.Add(emailTextBox);
            leftPanel.Controls.Add(emailLabel);
            leftPanel.Controls.Add(subtitleLabel);
            leftPanel.Controls.Add(welcomeLabel);
            leftPanel.Controls.Add(logoLabel);
            leftPanel.Controls.Add(logoPicture);
            leftPanel.Controls.Add(themeToggleButton);
            leftPanel.Location = new Point(0, 0);
            leftPanel.Margin = new Padding(4, 3, 4, 3);
            leftPanel.Name = "leftPanel";
            leftPanel.Size = new Size(700, 923);
            leftPanel.TabIndex = 0;
            // 
            // registerTextLabel
            // 
            registerTextLabel.BackColor = Color.Transparent;
            registerTextLabel.Font = new Font("Segoe UI", 10F);
            registerTextLabel.ForeColor = Color.FromArgb(120, 120, 120);
            registerTextLabel.Location = new Point(82, 704);
            registerTextLabel.Margin = new Padding(4, 0, 4, 0);
            registerTextLabel.Name = "registerTextLabel";
            registerTextLabel.Size = new Size(318, 29);
            registerTextLabel.TabIndex = 10;
            registerTextLabel.Text = "Don't have an account? ";
            registerTextLabel.TextAlign = ContentAlignment.MiddleRight;
            // 
            // registerLinkLabel
            // 
            registerLinkLabel.BackColor = Color.Transparent;
            registerLinkLabel.Cursor = Cursors.Hand;
            registerLinkLabel.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            registerLinkLabel.ForeColor = Color.FromArgb(0, 102, 204);
            registerLinkLabel.Location = new Point(408, 704);
            registerLinkLabel.Margin = new Padding(4, 0, 4, 0);
            registerLinkLabel.Name = "registerLinkLabel";
            registerLinkLabel.Size = new Size(210, 29);
            registerLinkLabel.TabIndex = 11;
            registerLinkLabel.Text = "Register";
            registerLinkLabel.TextAlign = ContentAlignment.MiddleLeft;
            // 
            // loginButton
            // 
            loginButton.BackColor = Color.FromArgb(124, 58, 237);
            loginButton.Cursor = Cursors.Hand;
            loginButton.FlatAppearance.BorderSize = 0;
            loginButton.FlatStyle = FlatStyle.Flat;
            loginButton.Font = new Font("Segoe UI", 12F, FontStyle.Bold);
            loginButton.ForeColor = Color.White;
            loginButton.Location = new Point(82, 623);
            loginButton.Margin = new Padding(4, 3, 4, 3);
            loginButton.Name = "loginButton";
            loginButton.Size = new Size(537, 58);
            loginButton.TabIndex = 9;
            loginButton.Text = "Login";
            loginButton.UseVisualStyleBackColor = false;
            // 
            // togglePasswordButton
            // 
            togglePasswordButton.BackColor = Color.Transparent;
            togglePasswordButton.Cursor = Cursors.Hand;
            togglePasswordButton.FlatAppearance.BorderSize = 0;
            togglePasswordButton.FlatStyle = FlatStyle.Flat;
            togglePasswordButton.Font = new Font("Segoe UI", 12F);
            togglePasswordButton.Location = new Point(572, 539);
            togglePasswordButton.Margin = new Padding(4, 3, 4, 3);
            togglePasswordButton.Name = "togglePasswordButton";
            togglePasswordButton.Size = new Size(35, 35);
            togglePasswordButton.TabIndex = 8;
            togglePasswordButton.Text = "👁";
            togglePasswordButton.UseVisualStyleBackColor = false;
            // 
            // passwordTextBox
            // 
            passwordTextBox.BorderStyle = BorderStyle.FixedSingle;
            passwordTextBox.Font = new Font("Segoe UI", 12F);
            passwordTextBox.Location = new Point(82, 531);
            passwordTextBox.Margin = new Padding(4, 3, 4, 3);
            passwordTextBox.Name = "passwordTextBox";
            passwordTextBox.Size = new Size(536, 29);
            passwordTextBox.TabIndex = 7;
            passwordTextBox.UseSystemPasswordChar = true;
            // 
            // passwordLabel
            // 
            passwordLabel.BackColor = Color.Transparent;
            passwordLabel.Font = new Font("Segoe UI", 10F);
            passwordLabel.Location = new Point(82, 496);
            passwordLabel.Margin = new Padding(4, 0, 4, 0);
            passwordLabel.Name = "passwordLabel";
            passwordLabel.Size = new Size(537, 25);
            passwordLabel.TabIndex = 6;
            passwordLabel.Text = "Password";
            // 
            // emailTextBox
            // 
            emailTextBox.BorderStyle = BorderStyle.FixedSingle;
            emailTextBox.Font = new Font("Segoe UI", 12F);
            emailTextBox.Location = new Point(82, 415);
            emailTextBox.Margin = new Padding(4, 3, 4, 3);
            emailTextBox.Name = "emailTextBox";
            emailTextBox.Size = new Size(536, 29);
            emailTextBox.TabIndex = 5;
            emailTextBox.Text = "Enter your email";
            // 
            // emailLabel
            // 
            emailLabel.BackColor = Color.Transparent;
            emailLabel.Font = new Font("Segoe UI", 10F);
            emailLabel.Location = new Point(82, 381);
            emailLabel.Margin = new Padding(4, 0, 4, 0);
            emailLabel.Name = "emailLabel";
            emailLabel.Size = new Size(537, 25);
            emailLabel.TabIndex = 4;
            emailLabel.Text = "Email Address";
            // 
            // subtitleLabel
            // 
            subtitleLabel.BackColor = Color.Transparent;
            subtitleLabel.Font = new Font("Segoe UI", 11F);
            subtitleLabel.Location = new Point(82, 294);
            subtitleLabel.Margin = new Padding(4, 0, 4, 0);
            subtitleLabel.Name = "subtitleLabel";
            subtitleLabel.Size = new Size(525, 29);
            subtitleLabel.TabIndex = 3;
            subtitleLabel.Text = "Login to your account to continue";
            // 
            // welcomeLabel
            // 
            welcomeLabel.BackColor = Color.Transparent;
            welcomeLabel.Font = new Font("Segoe UI", 28F, FontStyle.Bold);
            welcomeLabel.Location = new Point(82, 231);
            welcomeLabel.Margin = new Padding(4, 0, 4, 0);
            welcomeLabel.Name = "welcomeLabel";
            welcomeLabel.Size = new Size(537, 58);
            welcomeLabel.TabIndex = 2;
            welcomeLabel.Text = "Welcome Back! 👋";
            // 
            // logoLabel
            // 
            logoLabel.AutoSize = true;
            logoLabel.BackColor = Color.Transparent;
            logoLabel.Font = new Font("Segoe UI", 14F, FontStyle.Bold);
            logoLabel.Location = new Point(152, 83);
            logoLabel.Margin = new Padding(4, 0, 4, 0);
            logoLabel.Name = "logoLabel";
            logoLabel.Size = new Size(58, 25);
            logoLabel.TabIndex = 1;
            logoLabel.Text = "Logo";
            // 
            // logoPicture
            // 
            logoPicture.BackColor = Color.FromArgb(124, 58, 237);
            logoPicture.Location = new Point(82, 69);
            logoPicture.Margin = new Padding(4, 3, 4, 3);
            logoPicture.Name = "logoPicture";
            logoPicture.Size = new Size(58, 58);
            logoPicture.TabIndex = 0;
            logoPicture.TabStop = false;
            // 
            // themeToggleButton
            // 
            themeToggleButton.BackColor = Color.White;
            themeToggleButton.Cursor = Cursors.Hand;
            themeToggleButton.FlatAppearance.BorderSize = 0;
            themeToggleButton.FlatStyle = FlatStyle.Flat;
            themeToggleButton.Font = new Font("Segoe UI", 16F);
            themeToggleButton.Location = new Point(630, 23);
            themeToggleButton.Margin = new Padding(4, 3, 4, 3);
            themeToggleButton.Name = "themeToggleButton";
            themeToggleButton.Size = new Size(47, 46);
            themeToggleButton.TabIndex = 12;
            themeToggleButton.Text = "🌙";
            themeToggleButton.UseVisualStyleBackColor = false;
            // 
            // carouselPanel
            // 
            carouselPanel.BackColor = Color.Transparent;
            carouselPanel.Location = new Point(700, 0);
            carouselPanel.Margin = new Padding(4, 3, 4, 3);
            carouselPanel.Name = "carouselPanel";
            carouselPanel.Size = new Size(817, 923);
            carouselPanel.TabIndex = 1;
            // 
            // LoginForm
            // 
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            BackColor = Color.White;
            ClientSize = new Size(1517, 923);
            Controls.Add(carouselPanel);
            Controls.Add(leftPanel);
            FormBorderStyle = FormBorderStyle.FixedDialog;
            Margin = new Padding(4, 3, 4, 3);
            MaximizeBox = false;
            Name = "LoginForm";
            StartPosition = FormStartPosition.CenterScreen;
            Text = "Login - FreelanceHu";
            leftPanel.ResumeLayout(false);
            leftPanel.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)logoPicture).EndInit();
            ResumeLayout(false);
        }
    }
}
