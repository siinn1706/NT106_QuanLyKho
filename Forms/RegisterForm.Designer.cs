namespace NT106_Nhom12_Pro.Forms
{
    partial class RegisterForm
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
        private System.Windows.Forms.Button registerButton;
        private System.Windows.Forms.Label loginTextLabel;
        private System.Windows.Forms.Label loginLinkLabel;
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
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(RegisterForm));
            leftPanel = new Panel();
            loginTextLabel = new Label();
            loginLinkLabel = new Label();
            registerButton = new Button();
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
            leftPanel.Controls.Add(loginTextLabel);
            leftPanel.Controls.Add(loginLinkLabel);
            leftPanel.Controls.Add(registerButton);
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
            // loginTextLabel
            // 
            loginTextLabel.BackColor = Color.Transparent;
            loginTextLabel.Font = new Font("Segoe UI", 10F);
            loginTextLabel.ForeColor = Color.FromArgb(120, 120, 120);
            loginTextLabel.Location = new Point(82, 681);
            loginTextLabel.Margin = new Padding(4, 0, 4, 0);
            loginTextLabel.Name = "loginTextLabel";
            loginTextLabel.Size = new Size(303, 29);
            loginTextLabel.TabIndex = 10;
            loginTextLabel.Text = "Already have an account? ";
            loginTextLabel.TextAlign = ContentAlignment.MiddleRight;
            // 
            // loginLinkLabel
            // 
            loginLinkLabel.BackColor = Color.Transparent;
            loginLinkLabel.Cursor = Cursors.Hand;
            loginLinkLabel.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            loginLinkLabel.ForeColor = Color.FromArgb(0, 102, 204);
            loginLinkLabel.Location = new Point(393, 681);
            loginLinkLabel.Margin = new Padding(4, 0, 4, 0);
            loginLinkLabel.Name = "loginLinkLabel";
            loginLinkLabel.Size = new Size(225, 29);
            loginLinkLabel.TabIndex = 11;
            loginLinkLabel.Text = "Login";
            loginLinkLabel.TextAlign = ContentAlignment.MiddleLeft;
            // 
            // registerButton
            // 
            registerButton.BackColor = Color.FromArgb(124, 58, 237);
            registerButton.Cursor = Cursors.Hand;
            registerButton.FlatAppearance.BorderSize = 0;
            registerButton.FlatStyle = FlatStyle.Flat;
            registerButton.Font = new Font("Segoe UI", 12F, FontStyle.Bold);
            registerButton.ForeColor = Color.White;
            registerButton.Location = new Point(82, 600);
            registerButton.Margin = new Padding(4, 3, 4, 3);
            registerButton.Name = "registerButton";
            registerButton.Size = new Size(537, 58);
            registerButton.TabIndex = 9;
            registerButton.Text = "Register with us";
            registerButton.UseVisualStyleBackColor = false;
            // 
            // togglePasswordButton
            // 
            togglePasswordButton.BackColor = Color.Transparent;
            togglePasswordButton.Cursor = Cursors.Hand;
            togglePasswordButton.FlatAppearance.BorderSize = 0;
            togglePasswordButton.FlatStyle = FlatStyle.Flat;
            togglePasswordButton.Font = new Font("Segoe UI", 12F);
            togglePasswordButton.Location = new Point(572, 516);
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
            passwordTextBox.Location = new Point(82, 508);
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
            passwordLabel.Location = new Point(82, 473);
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
            emailTextBox.Location = new Point(82, 392);
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
            emailLabel.Location = new Point(82, 358);
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
            subtitleLabel.Location = new Point(82, 271);
            subtitleLabel.Margin = new Padding(4, 0, 4, 0);
            subtitleLabel.Name = "subtitleLabel";
            subtitleLabel.Size = new Size(525, 29);
            subtitleLabel.TabIndex = 3;
            subtitleLabel.Text = "Kindly fill in your details below to create an account";
            // 
            // welcomeLabel
            // 
            welcomeLabel.BackColor = Color.Transparent;
            welcomeLabel.Font = new Font("Segoe UI", 28F, FontStyle.Bold);
            welcomeLabel.Location = new Point(82, 208);
            welcomeLabel.Margin = new Padding(4, 0, 4, 0);
            welcomeLabel.Name = "welcomeLabel";
            welcomeLabel.Size = new Size(610, 58);
            welcomeLabel.TabIndex = 2;
            welcomeLabel.Text = "Welcome to NetWare👋";
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
            logoPicture.InitialImage = (Image)resources.GetObject("logoPicture.InitialImage");
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
            // RegisterForm
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
            Name = "RegisterForm";
            StartPosition = FormStartPosition.CenterScreen;
            Text = "Register - FreelanceHu";
            leftPanel.ResumeLayout(false);
            leftPanel.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)logoPicture).EndInit();
            ResumeLayout(false);
        }
    }
}
