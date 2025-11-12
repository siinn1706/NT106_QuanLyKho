// File: Views/Dashboard_View.Designer.cs

#nullable enable

using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;
using Guna.UI2.WinForms;
using NT106_Nhom12_Pro.Utils;

namespace NT106_Nhom12_Pro.Views
{
    partial class Dashboard_View
    {
        private System.ComponentModel.IContainer? components = null;
        private FlowLayoutPanel flow_Stats = null!;
        private FlowLayoutPanel flow_Charts = null!;
        private Guna2Panel card_Uptime = null!;
        private Guna2Panel card_Issues = null!;
        private Guna2Panel card_Usage = null!;
        private Guna2Panel card_Lab_Equipment = null!;
        private Guna2Panel card_Radiology_Equipment = null!;
        private Guna2DataGridView dgv_Activities = null!;
        private Guna2ComboBox cmb_Category_Filter = null!;
        private Guna2ComboBox cmb_Time_Filter = null!;
        private Panel panel_Filters = null!;
        private Guna2Panel panel_Table_Container = null!;

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
            this.components = new System.ComponentModel.Container();

            this.AutoScaleDimensions = new SizeF(96F, 96F);
            this.AutoScaleMode = AutoScaleMode.Dpi;
            this.BackColor = Theme_Colors.Light.Background;
            this.ClientSize = new Size(1130, 750);
            this.FormBorderStyle = FormBorderStyle.None;
            this.AutoScroll = true;

            // FlowLayoutPanel cho Stats
            flow_Stats = new FlowLayoutPanel
            {
                Location = new Point(0, 0),
                Size = new Size(1130, 140),
                AutoSize = false,
                WrapContents = true,
                Padding = new Padding(10),
                BackColor = Color.Transparent,
                Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right
            };

            card_Uptime = Create_Stat_Card("96%", "Thời gian hoạt động 7 ngày qua", "+12%", Theme_Colors.Accent.Green);
            card_Issues = Create_Stat_Card("14", "Vấn đề cần xử lý", "", Theme_Colors.Accent.Red);
            card_Usage = Create_Stat_Card("78%", "Mức sử dụng thiết bị và vật tư", "", Theme_Colors.Accent.Blue);

            flow_Stats.Controls.AddRange(new Control[] { card_Uptime, card_Issues, card_Usage });

            // FlowLayoutPanel cho Charts
            flow_Charts = new FlowLayoutPanel
            {
                Location = new Point(0, 160),
                Size = new Size(1130, 280),
                AutoSize = false,
                WrapContents = true,
                Padding = new Padding(10),
                BackColor = Color.Transparent,
                Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right
            };

            card_Lab_Equipment = Create_Equipment_Card(
                "Trạng Thái Thiết Bị Kho", "70%", "Hàng Có Sẵn",
                "Bảo trì lần cuối: 12/08/2024", "Bảo trì tiếp theo: 25/01/2025",
                Theme_Colors.Accent.Green
            );

            card_Radiology_Equipment = Create_Equipment_Card(
                "Bảo Trì Thiết Bị Vận Chuyển", "60%", "Đang Bảo Trì",
                "Bảo trì lần cuối: 12/08/2024", "Bảo trì tiếp theo: 12/08/2024",
                Theme_Colors.Accent.Red
            );

            flow_Charts.Controls.AddRange(new Control[] { card_Lab_Equipment, card_Radiology_Equipment });

            // Activities Section Header
            var lbl_Activities_Title = new Label
            {
                Text = "Trạng Thái Tồn Kho Thiết Bị",
                Font = new Font(new FontFamily("Segoe UI"), 16F, FontStyle.Bold),
                ForeColor = Theme_Colors.Light.TextPrimary,
                Location = new Point(20, 460),
                AutoSize = true,
                BackColor = Color.Transparent,
                Anchor = AnchorStyles.Top | AnchorStyles.Left
            };

            // Filters Panel
            panel_Filters = new Panel
            {
                Location = new Point(730, 460),
                Size = new Size(380, 36),
                BackColor = Color.Transparent,
                Anchor = AnchorStyles.Top | AnchorStyles.Right
            };

            cmb_Category_Filter = new Guna2ComboBox
            {
                Location = new Point(0, 0),
                Size = new Size(180, 36),
                Font = new Font(new FontFamily("Segoe UI"), 10F),
                BorderRadius = 8,
                ForeColor = Theme_Colors.Light.TextPrimary,
                FillColor = Theme_Colors.Light.CardBackground
            };
            cmb_Category_Filter.Items.AddRange(new object[] { "Tất Cả Danh Mục", "Kho A", "Kho B", "Kho C" });
            cmb_Category_Filter.SelectedIndex = 0;

            cmb_Time_Filter = new Guna2ComboBox
            {
                Location = new Point(200, 0),
                Size = new Size(180, 36),
                Font = new Font(new FontFamily("Segoe UI"), 10F),
                BorderRadius = 8,
                ForeColor = Theme_Colors.Light.TextPrimary,
                FillColor = Theme_Colors.Light.CardBackground
            };
            cmb_Time_Filter.Items.AddRange(new object[] { "7 ngày qua", "30 ngày qua", "3 tháng qua" });
            cmb_Time_Filter.SelectedIndex = 0;

            panel_Filters.Controls.AddRange(new Control[] { cmb_Category_Filter, cmb_Time_Filter });

            // Container Panel để bo góc cho bảng
            panel_Table_Container = new Guna2Panel
            {
                Location = new Point(20, 510),
                Size = new Size(1090, 220),
                BorderRadius = 12, // BO GÓC
                FillColor = Theme_Colors.Light.CardBackground,
                ShadowDecoration = { Enabled = false },
                Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom,
                Padding = new Padding(0)
            };

            // DataGridView
            dgv_Activities = new Guna2DataGridView
            {
                Location = new Point(0, 0),
                Dock = DockStyle.Fill,
                BackgroundColor = Theme_Colors.Light.CardBackground,
                BorderStyle = BorderStyle.None,
                CellBorderStyle = DataGridViewCellBorderStyle.SingleHorizontal,
                ColumnHeadersBorderStyle = DataGridViewHeaderBorderStyle.None,
                ColumnHeadersHeight = 40,
                RowTemplate = { Height = 50 },
                AllowUserToAddRows = false,
                AllowUserToDeleteRows = false,
                ReadOnly = true,
                AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill,
                SelectionMode = DataGridViewSelectionMode.FullRowSelect,
                GridColor = Theme_Colors.Light.Border,
                DefaultCellStyle = new DataGridViewCellStyle
                {
                    BackColor = Theme_Colors.Light.CardBackground,
                    ForeColor = Theme_Colors.Light.TextPrimary,
                    Font = new Font(new FontFamily("Segoe UI"), 10F),
                    SelectionBackColor = Color.FromArgb(220, 240, 250),
                    SelectionForeColor = Theme_Colors.Light.TextPrimary,
                    Padding = new Padding(8, 5, 8, 5),
                    WrapMode = DataGridViewTriState.False,
                    Alignment = DataGridViewContentAlignment.MiddleLeft
                },
                ColumnHeadersDefaultCellStyle = new DataGridViewCellStyle
                {
                    BackColor = Color.FromArgb(6, 182, 212),
                    ForeColor = Color.White,
                    Font = new Font(new FontFamily("Segoe UI"), 10F, FontStyle.Bold),
                    Alignment = DataGridViewContentAlignment.MiddleLeft,
                    Padding = new Padding(8, 5, 8, 5)
                }
            };

            // Add columns
            dgv_Activities.Columns.AddRange(new DataGridViewColumn[]
            {
                new DataGridViewTextBoxColumn { HeaderText = "STT", Name = "col_No", Width = 60, FillWeight = 10 },
                new DataGridViewTextBoxColumn { HeaderText = "Tiêu Đề", Name = "col_Title", FillWeight = 30 },
                new DataGridViewTextBoxColumn { HeaderText = "Ghi Chú", Name = "col_Remark", FillWeight = 30 },
                new DataGridViewTextBoxColumn { HeaderText = "Thời Gian", Name = "col_Timestamp", FillWeight = 20 },
                new DataGridViewTextBoxColumn { HeaderText = "Trạng Thái", Name = "col_Status", FillWeight = 15 }
            });

            // Add sample data
            dgv_Activities.Rows.Add("1", "Bảo trì máy quét MRI quá hạn", "Bảo trì đã quá hạn 3 ngày.", "25/01/2025 - 10:00 SA", "Khẩn Cấp");
            dgv_Activities.Rows.Add("2", "Tồn kho thấp: Aspirin 500mg", "Chỉ còn 5 gói.", "25/01/2025 - 09:30 SA", "Ưu Tiên Thấp");
            dgv_Activities.Rows.Add("3", "Đã thêm hàng tồn kho mới cho Kho", "Đã thêm 50 ống nghiệm.", "25/01/2025 - 09:00 SA", "Hoàn Thành");
            dgv_Activities.Rows.Add("4", "Yêu cầu hiệu chuẩn công cụ cho Kho", "Cần hiệu chuẩn kính hiển vi.", "24/01/2025 - 06:00 CH", "Đang Xử Lý");

            // Custom cell painting cho Status column
            dgv_Activities.CellPainting += Dgv_Activities_CellPainting;

            // Add DataGridView vào container
            panel_Table_Container.Controls.Add(dgv_Activities);

            this.Controls.AddRange(new Control[] {
                flow_Stats,
                flow_Charts,
                lbl_Activities_Title,
                panel_Filters,
                panel_Table_Container
            });

            this.Resize += Dashboard_View_Resize;
        }

        private void Dashboard_View_Resize(object? sender, EventArgs e)
        {
            flow_Stats.Width = this.ClientSize.Width - 20;
            flow_Charts.Width = this.ClientSize.Width - 20;
        }

        // Custom painting cho Status column với Badge và IN ĐẬM
        private void Dgv_Activities_CellPainting(object? sender, DataGridViewCellPaintingEventArgs e)
        {
            if (e.ColumnIndex == dgv_Activities.Columns["col_Status"]!.Index && e.RowIndex >= 0)
            {
                e.Paint(e.CellBounds, DataGridViewPaintParts.All & ~DataGridViewPaintParts.ContentForeground);

                string status = e.Value?.ToString() ?? "";
                if (!string.IsNullOrEmpty(status))
                {
                    // Định nghĩa màu cho từng trạng thái
                    Color bgColor, textColor;
                    switch (status)
                    {
                        case "Khẩn Cấp":
                            bgColor = Color.FromArgb(30, 239, 68, 68);
                            textColor = Theme_Colors.Accent.Red;
                            break;
                        case "Ưu Tiên Thấp":
                            bgColor = Color.FromArgb(30, 249, 115, 22);
                            textColor = Theme_Colors.Accent.Orange;
                            break;
                        case "Hoàn Thành":
                            bgColor = Color.FromArgb(30, 34, 197, 94);
                            textColor = Theme_Colors.Accent.Green;
                            break;
                        case "Đang Xử Lý":
                            bgColor = Color.FromArgb(30, 59, 130, 246);
                            textColor = Theme_Colors.Accent.Blue;
                            break;
                        default:
                            bgColor = Color.FromArgb(30, 148, 163, 184);
                            textColor = Theme_Colors.Light.TextSecondary;
                            break;
                    }

                    // FONT IN ĐẬM cho trạng thái
                    var boldFont = new Font(e.CellStyle!.Font!.FontFamily, e.CellStyle.Font.Size, FontStyle.Bold);

                    // Tính toán kích thước badge
                    var textSize = e.Graphics!.MeasureString(status, boldFont);
                    int badgeWidth = (int)textSize.Width + 24;
                    int badgeHeight = 30;
                    int badgeX = e.CellBounds.X + 10;
                    int badgeY = e.CellBounds.Y + (e.CellBounds.Height - badgeHeight) / 2;

                    // Vẽ badge bo tròn
                    using (var path = Get_Rounded_Rect(new Rectangle(badgeX, badgeY, badgeWidth, badgeHeight), 15))
                    {
                        e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
                        using (var brush = new SolidBrush(bgColor))
                        {
                            e.Graphics.FillPath(brush, path);
                        }
                    }

                    // Vẽ text IN ĐẬM
                    using (var brush = new SolidBrush(textColor))
                    {
                        var textRect = new RectangleF(badgeX, badgeY, badgeWidth, badgeHeight);
                        var format = new StringFormat
                        {
                            Alignment = StringAlignment.Center,
                            LineAlignment = StringAlignment.Center
                        };
                        e.Graphics.DrawString(status, boldFont, brush, textRect, format);
                    }
                }

                e.Handled = true;
            }
        }

        // Helper method để tạo rounded rectangle path
        private GraphicsPath Get_Rounded_Rect(Rectangle bounds, int radius)
        {
            int diameter = radius * 2;
            var path = new GraphicsPath();
            var arc = new Rectangle(bounds.Location, new Size(diameter, diameter));

            // Top left arc
            path.AddArc(arc, 180, 90);

            // Top right arc
            arc.X = bounds.Right - diameter;
            path.AddArc(arc, 270, 90);

            // Bottom right arc
            arc.Y = bounds.Bottom - diameter;
            path.AddArc(arc, 0, 90);

            // Bottom left arc
            arc.X = bounds.Left;
            path.AddArc(arc, 90, 90);

            path.CloseFigure();
            return path;
        }

        private Guna2Panel Create_Stat_Card(string value, string title, string change, Color accentColor)
        {
            var card = new Guna2Panel
            {
                Size = new Size(340, 120),
                BorderRadius = 12,
                FillColor = Theme_Colors.Light.CardBackground,
                ShadowDecoration = { Enabled = false },
                Margin = new Padding(10)
            };

            var lbl_Value = new Label
            {
                Text = value,
                Font = new Font(new FontFamily("Segoe UI"), 32F, FontStyle.Bold),
                ForeColor = Theme_Colors.Light.TextPrimary,
                AutoSize = true,
                Location = new Point(20, 15),
                BackColor = Color.Transparent
            };

            var lbl_Title = new Label
            {
                Text = title,
                Font = new Font(new FontFamily("Segoe UI"), 10F),
                ForeColor = Theme_Colors.Light.TextSecondary,
                AutoSize = true,
                Location = new Point(20, 65),
                BackColor = Color.Transparent
            };

            if (!string.IsNullOrEmpty(change))
            {
                var lbl_Change = new Label
                {
                    Text = change,
                    Font = new Font(new FontFamily("Segoe UI"), 10F, FontStyle.Bold),
                    ForeColor = Theme_Colors.Accent.Green,
                    AutoSize = true,
                    Location = new Point(140, 30),
                    BackColor = Color.Transparent
                };
                card.Controls.Add(lbl_Change);
            }

            var progressBar = new Guna2ProgressBar
            {
                Location = new Point(20, 95),
                Size = new Size(300, 8),
                ProgressColor = accentColor,
                ProgressColor2 = accentColor,
                BorderRadius = 4,
                Value = int.TryParse(value.Replace("%", ""), out int val) ? val : 50
            };

            card.Controls.AddRange(new Control[] { lbl_Value, lbl_Title, progressBar });

            lbl_Value.BringToFront();
            lbl_Title.BringToFront();
            progressBar.SendToBack();

            return card;
        }

        private Guna2Panel Create_Equipment_Card(string title, string percentage, string status,
            string lastMaintenance, string nextMaintenance, Color statusColor)
        {
            var card = new Guna2Panel
            {
                Size = new Size(535, 260),
                BorderRadius = 12,
                FillColor = Theme_Colors.Light.CardBackground,
                ShadowDecoration = { Enabled = false },
                Margin = new Padding(10)
            };

            var lbl_Title = new Label
            {
                Text = title,
                Font = new Font(new FontFamily("Segoe UI"), 14F, FontStyle.Bold),
                ForeColor = Theme_Colors.Light.TextPrimary,
                AutoSize = true,
                Location = new Point(20, 20),
                BackColor = Color.Transparent
            };

            var lbl_Percentage = new Label
            {
                Text = percentage,
                Font = new Font(new FontFamily("Segoe UI"), 48F, FontStyle.Bold),
                ForeColor = statusColor,
                AutoSize = true,
                Location = new Point(30, 70),
                BackColor = Color.Transparent
            };

            var lbl_Status = new Label
            {
                Text = status,
                Font = new Font(new FontFamily("Segoe UI"), 12F),
                ForeColor = Theme_Colors.Light.TextSecondary,
                AutoSize = true,
                Location = new Point(30, 145),
                BackColor = Color.Transparent
            };

            var progressBar = new Guna2ProgressBar
            {
                Location = new Point(30, 175),
                Size = new Size(360, 10),
                ProgressColor = statusColor,
                ProgressColor2 = statusColor,
                BorderRadius = 5,
                Value = int.TryParse(percentage.Replace("%", ""), out int val) ? val : 50
            };

            var lbl_Last = new Label
            {
                Text = lastMaintenance,
                Font = new Font(new FontFamily("Segoe UI"), 9F),
                ForeColor = Theme_Colors.Light.TextSecondary,
                AutoSize = true,
                Location = new Point(30, 200),
                BackColor = Color.Transparent
            };

            var lbl_Next = new Label
            {
                Text = nextMaintenance,
                Font = new Font(new FontFamily("Segoe UI"), 9F),
                ForeColor = Theme_Colors.Light.TextSecondary,
                AutoSize = true,
                Location = new Point(30, 225),
                BackColor = Color.Transparent
            };

            card.Controls.AddRange(new Control[] {
                lbl_Title, lbl_Percentage, lbl_Status, progressBar, lbl_Last, lbl_Next
            });

            lbl_Title.BringToFront();
            lbl_Percentage.BringToFront();
            lbl_Status.BringToFront();
            lbl_Last.BringToFront();
            lbl_Next.BringToFront();
            progressBar.SendToBack();

            return card;
        }
    }
}
