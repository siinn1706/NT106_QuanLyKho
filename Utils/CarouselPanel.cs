using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;
using NT106_Nhom12_Pro.Utils;

namespace NT106_Nhom12_Pro.Utils
{
    public class CarouselPanel : Panel
    {
        private System.Windows.Forms.Timer animationTimer;
        private int currentSlide = 0;
        private string[] titles = {
            "Connecting Talent\nto Opportunities",
            "Find Your Dream Job",
            "Build Your Portfolio"
        };
        private string[] descriptions = {
            "Discover endless opportunities on FreelanceHu,\nwhere talented freelancers and businesses unite.\nJump right in with us!",
            "Connect with top companies looking for\ntalented professionals like you.\nStart your journey today!",
            "Upload samples of your work to impress potential clients"
        };

        public CarouselPanel()
        {
            this.DoubleBuffered = true;
            this.BackColor = Color.Transparent;

            animationTimer = new System.Windows.Forms.Timer { Interval = 3000 };
            animationTimer.Tick += (s, e) =>
            {
                currentSlide = (currentSlide + 1) % titles.Length;
                this.Invalidate();
            };
            animationTimer.Start();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);

            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;

            using (LinearGradientBrush brush = new LinearGradientBrush(
                this.ClientRectangle,
                Theme.Colors.PrimaryPurpleLight,
                Theme.Colors.PrimaryPurple,
                45f))
            {
                e.Graphics.FillRectangle(brush, this.ClientRectangle);
            }

            DrawGlassEffect(e.Graphics);
            DrawContent(e.Graphics);
            DrawDots(e.Graphics);
        }

        private void DrawGlassEffect(Graphics g)
        {
            using (GraphicsPath path = new GraphicsPath())
            {
                Rectangle glassRect = new Rectangle(100, 100, this.Width - 200, this.Height - 300);
                path.AddRectangle(glassRect);

                using (PathGradientBrush brush = new PathGradientBrush(path))
                {
                    brush.CenterColor = Theme.Colors.GlassWhite;
                    brush.SurroundColors = new Color[] { Color.FromArgb(10, 255, 255, 255) };
                    g.FillPath(brush, path);
                }

                using (Pen pen = new Pen(Theme.Colors.GlassWhiteBorder, 2))
                {
                    g.DrawRectangle(pen, glassRect);
                }
            }
        }

        private void DrawContent(Graphics g)
        {
            int centerX = this.Width / 2;
            int centerY = this.Height / 2 - 50;

            using (Font titleFont = Theme.Fonts.CarouselTitle)
            using (StringFormat format = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center })
            {
                g.DrawString(titles[currentSlide], titleFont, Brushes.White,
                    new PointF(centerX, centerY - 80), format);
            }

            using (Font descFont = Theme.Fonts.CarouselDescription)
            using (StringFormat format = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center })
            {
                g.DrawString(descriptions[currentSlide], descFont, Brushes.White,
                    new PointF(centerX, centerY + 40), format);
            }
        }

        private void DrawDots(Graphics g)
        {
            int dotCount = titles.Length;
            int dotSize = 10;
            int dotSpacing = 20;
            int totalWidth = (dotCount * dotSize) + ((dotCount - 1) * (dotSpacing - dotSize));
            int startX = (this.Width - totalWidth) / 2;
            int y = this.Height - 80;

            for (int i = 0; i < dotCount; i++)
            {
                int x = startX + (i * dotSpacing);
                Color dotColor = i == currentSlide ? Color.White : Theme.Colors.OverlayWhite;

                using (SolidBrush brush = new SolidBrush(dotColor))
                {
                    g.FillEllipse(brush, x, y, dotSize, dotSize);
                }
            }

            int arrowY = y - 5;
            DrawArrow(g, startX - 40, arrowY, true);
            DrawArrow(g, startX + totalWidth + 30, arrowY, false);
        }

        private void DrawArrow(Graphics g, int x, int y, bool isLeft)
        {
            using (Pen pen = new Pen(Color.White, 2))
            {
                int offset = isLeft ? 10 : -10;
                g.DrawLine(pen, x, y + 10, x + offset, y + 5);
                g.DrawLine(pen, x, y + 10, x + offset, y + 15);
            }
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                animationTimer?.Stop();
                animationTimer?.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
