using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KhoHang.API.Models
{
    public class StockInItem
    {
        [Key]
        public int Id { get; set; }
        public int IdSanPham { get; set; } // Liên kết đến sản phẩm
        public int SoLuongNhap { get; set; } // Số lượng nhập
        public decimal GiaNhap { get; set; } // Giá nhập

        public int StockInId { get; set; }
        [ForeignKey("StockInId")]
        public StockIn StockIn { get; set; }
    }
}
