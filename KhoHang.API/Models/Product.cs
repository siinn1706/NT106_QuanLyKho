using System.ComponentModel.DataAnnotations;

namespace KhoHang.API.Models
{
    public class Product
    {
        [Key] //đây là Khóa chính
        public int Id { get; set; }

        [Required] // Bắt buộc phải có
        [StringLength(100)]
        public string Name { get; set; }

        [StringLength(50)]
        public string MaSP { get; set; } // Mã sản phẩm 

        public int SoLuongTonKho { get; set; } // Số lượng tồn kho

        public decimal GiaBan { get; set; } // Giá bán
    }
}
