using KhoHang.API.Data;
using KhoHang.API.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace KhoHang.API.Controllers
{
    [Route("api/[controller]")] // Đường dẫn sẽ là /api/products
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        // "Inject" DbContext vào
        public ProductsController(ApplicationDbContext context)
        {
            _context = context;
        }

        //API để lấy tất cả sản phẩm
        // gọi bằng GET http://localhost:1234/api/products
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Product>>> GetProducts()
        {
            var products = await _context.Products.ToListAsync();
            return Ok(products); // Trả về danh sách products dạng JSON
        }

        // API để tạo ra sản phẩm mới
        // gọi bằng POST http://localhost:1234/api/products
        [HttpPost]
        public async Task<ActionResult<Product>> CreateProduct(Product product)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Products.Add(product); // Thêm vào bộ nhớ
            await _context.SaveChangesAsync(); // Lưu vào SQL Server

            // Trả về sản phẩm vừa tạo (kèm ID mới)
            return CreatedAtAction(nameof(GetProducts), new { id = product.Id }, product);
        }
    }
}   