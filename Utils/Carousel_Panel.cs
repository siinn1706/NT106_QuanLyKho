using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Timers;
using System.Windows.Forms;

namespace NT106_Nhom12_Pro.Utils
{
    public class Carousel_Panel : Panel
    {
        // Khai báo controls giao diện
        private List<Carousel_Item> _items;
        private int _current_Index = 0;
        private System.Timers.Timer _timer;
        private Button _prev_Button;
        private Button _next_Button;
        private Panel _indicator_Panel;

        // Phương thức Carousel_Panel
        public Carousel_Panel()
        {
            Initialize_Components();
            Initialize_Timer();
        }

        // Phương thức Initialize_Components
        private void Initialize_Components()
        {
            this.DoubleBuffered = true;
            this.BackColor = Color.FromArgb(124, 58, 237);

            _items = new List<Carousel_Item>
            {
                new Carousel_Item
                {
                    Title = "Quản lý kho hiệu quả",
                    Description = "Đơn giản hóa việc nhập - xuất hàng với giao diện trực quan, cập nhật tồn kho tức thì và giảm thiểu sai sót trong vận hành.",
                    Icon = "📦"
                },
                new Carousel_Item
                {
                    Title = "Kết nối và cộng tác dễ dàng",
                    Description = "Liên kết giữa nhà cung cấp, nhân viên kho và quản lý trong cùng một nền tảng, giúp phối hợp công việc nhanh chóng và minh bạch.",
                    Icon = "🤝"
                },
                new Carousel_Item
                {
                    Title = "Dữ liệu trong tầm tay bạn",
                    Description = "Theo dõi số liệu nhập xuất, hiệu suất kho và báo cáo phân tích chi tiết để đưa ra quyết định chính xác, kịp thời.",
                    Icon = "📈"
                }
            };

            _prev_Button = new Button
            {
                Text = "❮",
                Font = new System.Drawing.Font("Segoe UI", 18F, FontStyle.Bold),
                Size = new Size(50, 50),
                Location = new Point(30, 400),
                BackColor = Color.FromArgb(100, 255, 255, 255),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            _prev_Button.FlatAppearance.BorderSize = 0;
            _prev_Button.Click += Prev_Button_Click;

            _next_Button = new Button
            {
                Text = "❯",
                Font = new System.Drawing.Font("Segoe UI", 18F, FontStyle.Bold),
                Size = new Size(50, 50),
                Location = new Point(this.Width - 80, 400),
                BackColor = Color.FromArgb(100, 255, 255, 255),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            _next_Button.FlatAppearance.BorderSize = 0;
            _next_Button.Click += Next_Button_Click;

            _indicator_Panel = new Panel
            {
                Size = new Size(200, 30),
                Location = new Point((this.Width - 200) / 2, this.Height - 80),
                BackColor = Color.Transparent
            };

            this.Controls.Add(_prev_Button);
            this.Controls.Add(_next_Button);
            this.Controls.Add(_indicator_Panel);

            Update_Indicators();
        }

        // Phương thức Initialize_Timer
        private void Initialize_Timer()
        {
_timer = new System.Timers.Timer(5000);
            _timer.Elapsed += Timer_Elapsed;
            _timer.AutoReset = true;
            _timer.Start();
        }

        // Phương thức Timer_Elapsed
        private void Timer_Elapsed(object sender, ElapsedEventArgs e)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action(() => Next_Slide()));
            }
            else
            {
                Next_Slide();
            }
        }

        // Phương thức Next_Slide
        private void Next_Slide()
        {
            _current_Index = (_current_Index + 1) % _items.Count;
            Update_Indicators();
            this.Invalidate();
        }

        // Phương thức Previous_Slide
        private void Previous_Slide()
        {
            _current_Index = (_current_Index - 1 + _items.Count) % _items.Count;
            Update_Indicators();
            this.Invalidate();
        }

        // Phương thức Prev_Button_Click
        private void Prev_Button_Click(object sender, EventArgs e)
        {
            _timer.Stop();
            Previous_Slide();
            _timer.Start();
        }

        // Phương thức Next_Button_Click
        private void Next_Button_Click(object sender, EventArgs e)
        {
            _timer.Stop();
            Next_Slide();
            _timer.Start();
        }

        // Phương thức Update_Indicators
        private void Update_Indicators()
        {
            _indicator_Panel.Controls.Clear();
            int dot_Size = 12;
            int spacing = 20;
            int total_Width = (_items.Count * dot_Size) + ((_items.Count - 1) * (spacing - dot_Size));
            int start_X = (_indicator_Panel.Width - total_Width) / 2;

            for (int i = 0; i < _items.Count; i++)
            {
                Panel dot = new Panel
                {
                    Size = new Size(dot_Size, dot_Size),
                    Location = new Point(start_X + (i * spacing), 10),
                    BackColor = i == _current_Index ? Color.White : Color.FromArgb(150, 255, 255, 255)
                };

                GraphicsPath path = new GraphicsPath();
                path.AddEllipse(0, 0, dot_Size, dot_Size);
                dot.Region = new Region(path);

                _indicator_Panel.Controls.Add(dot);
            }
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);

            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            e.Graphics.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAlias;

            if (_items.Count > 0 && _current_Index < _items.Count)
            {
                Carousel_Item current_Item = _items[_current_Index];

                using (LinearGradientBrush brush = new LinearGradientBrush(
                    this.ClientRectangle,
                    Color.FromArgb(139, 92, 246),
                    Color.FromArgb(124, 58, 237),
                    LinearGradientMode.Vertical))
                {
                    e.Graphics.FillRectangle(brush, this.ClientRectangle);
                }

                using (System.Drawing.Font icon_Font = new System.Drawing.Font("Segoe UI Emoji", 48F))
                {
                    SizeF icon_Size = e.Graphics.MeasureString(current_Item.Icon, icon_Font);
                    PointF icon_Position = new PointF(
                        (this.Width - icon_Size.Width) / 2,
                        150
                    );
                    e.Graphics.DrawString(current_Item.Icon, icon_Font, Brushes.White, icon_Position);
                }

                using (System.Drawing.Font title_Font = new System.Drawing.Font("Segoe UI", 32F, FontStyle.Bold))
                {
                    StringFormat format = new StringFormat
                    {
                        Alignment = StringAlignment.Center,
                        LineAlignment = StringAlignment.Center
                    };

                    RectangleF title_Rect = new RectangleF(50, 250, this.Width - 100, 150);
                    e.Graphics.DrawString(current_Item.Title, title_Font, Brushes.White, title_Rect, format);
                }

                using (System.Drawing.Font desc_Font = new System.Drawing.Font("Segoe UI", 14F))
                {
                    StringFormat format = new StringFormat
                    {
                        Alignment = StringAlignment.Center,
                        LineAlignment = StringAlignment.Center
                    };

                    RectangleF desc_Rect = new RectangleF(100, 420, this.Width - 200, 100);
                    e.Graphics.DrawString(current_Item.Description, desc_Font, Brushes.White, desc_Rect, format);
                }
            }
        }

        protected override void OnResize(EventArgs e)
        {
            base.OnResize(e);

            if (_next_Button != null)
            {
                _next_Button.Location = new Point(this.Width - 80, 400);
            }

            if (_indicator_Panel != null)
            {
                _indicator_Panel.Location = new Point((this.Width - 200) / 2, this.Height - 80);
            }

            this.Invalidate();
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                _timer?.Stop();
                _timer?.Dispose();
            }
            base.Dispose(disposing);
        }
    }

    public class Carousel_Item
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public string Icon { get; set; }
    }
}
