using KhoHang.API.Models;
using Microsoft.EntityFrameworkCore;

namespace KhoHang.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        // Khai báo các table mà EF Core sẽ quản lý
        public DbSet<Product> Products { get; set; }
        public DbSet<StockIn> StockIns { get; set; }
        public DbSet<StockInItem> StockInItems { get; set; }
    }
}
