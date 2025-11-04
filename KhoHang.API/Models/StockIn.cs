using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace KhoHang.API.Models
{
    public class StockIn
    {
        [Key]
        public int Id { get; set; } //Khóa chính
        public DateTime NgLapPhieu { get; set; } //Ngày lập phiếu
        public string TenNhaCungCap { get; set; } //Tên nhà cung cấp
        public decimal TongTien { get; set; } //Tổng tiền
        public List<StockIn> SanPham { get; set; }
    }
}
