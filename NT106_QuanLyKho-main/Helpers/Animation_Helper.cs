// File: Helpers/Animation_Helper.cs

using System;
using System.Drawing;
using System.Windows.Forms;

namespace NT106_Nhom12_Pro.Helpers
{
    public static class Animation_Helper
    {
        public static void Fade_In(Control control, int duration = 300)
        {
            var timer = new Timer { Interval = 10 };
            double step = 1.0 / (duration / 10.0);
            double opacity = 0;

            timer.Tick += (s, e) =>
            {
                opacity += step;
                if (opacity >= 1)
                {
                    opacity = 1;
                    timer.Stop();
                    timer.Dispose();
                }
                // WinForms controls don't have opacity, apply to form level
            };
            timer.Start();
        }

        public static void Slide_Panel(Panel panel, int targetWidth, int duration = 300)
        {
            var timer = new Timer { Interval = 10 };
            int startWidth = panel.Width;
            int totalSteps = duration / 10;
            int currentStep = 0;

            timer.Tick += (s, e) =>
            {
                currentStep++;
                double progress = (double)currentStep / totalSteps;
                panel.Width = startWidth + (int)((targetWidth - startWidth) * progress);

                if (currentStep >= totalSteps)
                {
                    panel.Width = targetWidth;
                    timer.Stop();
                    timer.Dispose();
                }
            };
            timer.Start();
        }
    }
}
