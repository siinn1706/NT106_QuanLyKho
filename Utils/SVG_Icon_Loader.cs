using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using Svg;

namespace NT106_Nhom12_Pro.Utils
{
    public static class SVG_Icon_Loader
    {
        // Phương thức Draw_SVG_Icon
        public static void Draw_SVG_Icon(Graphics g, Rectangle bounds, string svg_File_Name, Color target_Color)
        {
            try
            {
                string base_Path = AppDomain.CurrentDomain.BaseDirectory;
                string file_Path = Path.Combine(base_Path, "Resources", "icons", svg_File_Name);

                System.Diagnostics.Debug.WriteLine($"Trying to load SVG from: {file_Path}");
                System.Diagnostics.Debug.WriteLine($"File exists: {File.Exists(file_Path)}");

                if (!File.Exists(file_Path))
                {
                    file_Path = Path.Combine(base_Path, "..", "..", "Resources", "icons", svg_File_Name);
                    file_Path = Path.GetFullPath(file_Path);

                    System.Diagnostics.Debug.WriteLine($"Alternative path: {file_Path}");
                    System.Diagnostics.Debug.WriteLine($"Alternative exists: {File.Exists(file_Path)}");
                }

                if (!File.Exists(file_Path))
                {
                    Draw_Fallback_Icon(g, bounds, target_Color, $"File not found: {svg_File_Name}");
                    return;
                }

                SvgDocument svg_Doc = SvgDocument.Open(file_Path);

                if (svg_Doc == null)
                {
                    Draw_Fallback_Icon(g, bounds, target_Color, "SVG document is null");
                    return;
                }

                Change_SVG_Color(svg_Doc, target_Color);

                float svg_Width = svg_Doc.Width.Value;
                float svg_Height = svg_Doc.Height.Value;

                if (svg_Width == 0 || svg_Height == 0)
                {
                    svg_Width = svg_Doc.ViewBox.Width;
                    svg_Height = svg_Doc.ViewBox.Height;
                }

                float scale_X = (float)bounds.Width / svg_Width;
                float scale_Y = (float)bounds.Height / svg_Height;
float scale = Math.Min(scale_X, scale_Y) * 0.8f;

                float offset_X = bounds.X + (bounds.Width - svg_Width * scale) / 2;
                float offset_Y = bounds.Y + (bounds.Height - svg_Height * scale) / 2;

                g.SmoothingMode = SmoothingMode.AntiAlias;
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.PixelOffsetMode = PixelOffsetMode.HighQuality;

                GraphicsState state = g.Save();

                g.TranslateTransform(offset_X, offset_Y);
                g.ScaleTransform(scale, scale);

                svg_Doc.Draw(g);

                g.Restore(state);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error loading SVG: {ex.Message}");
                System.Diagnostics.Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                Draw_Fallback_Icon(g, bounds, target_Color, ex.Message);
            }
        }

        // Phương thức Change_SVG_Color
        private static void Change_SVG_Color(SvgElement element, Color target_Color)
        {
            if (element == null) return;

            try
            {
                if (element.Fill != null && element.Fill != SvgPaintServer.None)
                {
                    element.Fill = new SvgColourServer(target_Color);
                }

                if (element.Stroke != null && element.Stroke != SvgPaintServer.None)
                {
                    element.Stroke = new SvgColourServer(target_Color);
                }

                if (element.Opacity > 0)
                {
                    element.Opacity = 1.0f;
                }

                if (element.Children != null)
                {
                    foreach (var child in element.Children)
                    {
                        Change_SVG_Color(child, target_Color);
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error changing color: {ex.Message}");
            }
        }

        // Phương thức Draw_Fallback_Icon
        private static void Draw_Fallback_Icon(Graphics g, Rectangle bounds, Color color, string error_Message = "")
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;

            int margin = 8;
            using (Pen pen = new Pen(color, 2f))
            {
                g.DrawLine(pen,
                    bounds.X + margin,
                    bounds.Y + margin,
                    bounds.Right - margin,
                    bounds.Bottom - margin);

                g.DrawLine(pen,
                    bounds.Right - margin,
                    bounds.Y + margin,
                    bounds.X + margin,
                    bounds.Bottom - margin);
            }

            if (!string.IsNullOrEmpty(error_Message))
            {
                System.Diagnostics.Debug.WriteLine($"Fallback icon drawn: {error_Message}");
            }
        }
    }
}
