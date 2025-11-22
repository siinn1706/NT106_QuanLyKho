/** Stock_Out_Page.tsx - Trang Xuất kho */

import { useState } from 'react';
import { FaBox, FaCalendar, FaUser, FaFileAlt, FaSearch } from 'react-icons/fa';

export default function Stock_Out_Page() {
  const [formData, setFormData] = useState({
    itemName: '',
    itemCode: '',
    quantity: '',
    unit: '',
    recipient: '',
    purpose: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  const [availableStock, setAvailableStock] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (availableStock !== null && parseInt(formData.quantity) > availableStock) {
      alert(`Không đủ hàng trong kho! Tồn kho hiện tại: ${availableStock}`);
      return;
    }

    console.log('Xuất kho:', formData);
    // TODO: Call API xuất kho
    alert('Xuất kho thành công!');
    // Reset form
    setFormData({
      itemName: '',
      itemCode: '',
      quantity: '',
      unit: '',
      recipient: '',
      purpose: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    });
    setAvailableStock(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearchItem = () => {
    // TODO: Call API tìm hàng
    // Mock data
    if (formData.itemCode) {
      setAvailableStock(150); // Giả lập có 150 sản phẩm trong kho
      alert('Đã tìm thấy sản phẩm! Tồn kho: 150');
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-zinc-500 dark:text-zinc-400">
        <span>Nhập/Xuất kho</span>
        <span className="mx-2">{'>'}</span>
        <span className="text-zinc-900 dark:text-white">Xuất kho</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Xuất kho</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Xuất hàng hoá ra khỏi kho
          </p>
        </div>
      </div>

      {/* Stock Alert */}
      {availableStock !== null && (
        <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-info/30 bg-info/10 p-4">
          <div className="flex items-center gap-3">
            <FaBox className="text-info text-xl" />
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                Tồn kho hiện tại: <span className="text-info font-bold">{availableStock}</span> sản phẩm
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Đảm bảo không xuất vượt quá số lượng tồn kho
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Mã hàng
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="itemCode"
                  value={formData.itemCode}
                  onChange={handleChange}
                  required
                  className="flex-1 px-4 py-3 border border-black/10 dark:border-white/10 rounded-[16px] liquid-glass dark:liquid-glass-dark text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-warning shadow-ios transition-all"
                  placeholder="Nhập mã SKU hoặc barcode"
                />
                <button
                  type="button"
                  onClick={handleSearchItem}
                  className="px-4 py-3 rounded-[16px] bg-primary text-white hover:scale-105 transition-transform shadow-ios"
                >
                  <FaSearch />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                <FaBox className="inline mr-2" />
                Tên hàng hoá
              </label>
              <input
                type="text"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-black/10 dark:border-white/10 rounded-[16px] liquid-glass dark:liquid-glass-dark text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-warning shadow-ios transition-all"
                placeholder="Tên hàng hoá"
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Số lượng xuất
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="1"
                max={availableStock || undefined}
                className="w-full px-4 py-3 border border-black/10 dark:border-white/10 rounded-[16px] liquid-glass dark:liquid-glass-dark text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-warning shadow-ios transition-all"
                placeholder="0"
              />
              {availableStock !== null && parseInt(formData.quantity) > availableStock && (
                <p className="text-danger text-sm mt-1">Vượt quá tồn kho!</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Đơn vị
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-black/10 dark:border-white/10 rounded-[16px] liquid-glass dark:liquid-glass-dark text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-warning shadow-ios transition-all"
              >
                <option value="">Chọn đơn vị</option>
                <option value="Cái">Cái</option>
                <option value="Hộp">Hộp</option>
                <option value="Thùng">Thùng</option>
                <option value="Kg">Kg</option>
                <option value="Lít">Lít</option>
                <option value="Bộ">Bộ</option>
              </select>
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                <FaUser className="inline mr-2" />
                Người nhận
              </label>
              <input
                type="text"
                name="recipient"
                value={formData.recipient}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-black/10 dark:border-white/10 rounded-[16px] liquid-glass dark:liquid-glass-dark text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-warning shadow-ios transition-all"
                placeholder="Tên người/đơn vị nhận"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                <FaCalendar className="inline mr-2" />
                Ngày xuất
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-black/10 dark:border-white/10 rounded-[16px] liquid-glass dark:liquid-glass-dark text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-warning shadow-ios transition-all"
              />
            </div>
          </div>

          {/* Row 4 */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Mục đích xuất kho
            </label>
            <select
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-black/10 dark:border-white/10 rounded-[16px] liquid-glass dark:liquid-glass-dark text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-warning shadow-ios transition-all"
            >
              <option value="">Chọn mục đích</option>
              <option value="Bán hàng">Bán hàng</option>
              <option value="Chuyển kho">Chuyển kho</option>
              <option value="Sử dụng nội bộ">Sử dụng nội bộ</option>
              <option value="Bảo hành/Đổi trả">Bảo hành/Đổi trả</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          {/* Row 5 */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              <FaFileAlt className="inline mr-2" />
              Ghi chú
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-black/10 dark:border-white/10 rounded-[16px] liquid-glass dark:liquid-glass-dark text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-warning shadow-ios transition-all resize-none"
              placeholder="Ghi chú thêm về xuất kho (tùy chọn)"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-end pt-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-3 rounded-[20px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:scale-105 transition-transform shadow-ios"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-8 py-3 rounded-[20px] bg-warning text-white font-medium hover:scale-105 transition-transform shadow-ios hover:bg-warning/90 backdrop-blur-sm"
            >
              Xác nhận xuất kho
            </button>
          </div>
        </form>
      </div>

      {/* Recent Exports */}
      <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Lịch sử xuất kho gần đây
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-[16px] bg-warning/5 border border-warning/20">
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Laptop Dell XPS 15</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">10 cái • Khách hàng ABC Corp</p>
            </div>
            <div className="text-right">
              <p className="text-warning font-bold">-10</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">1 giờ trước</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-[16px] bg-warning/5 border border-warning/20">
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">iPhone 15 Pro Max</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">5 cái • Cửa hàng chi nhánh 2</p>
            </div>
            <div className="text-right">
              <p className="text-warning font-bold">-5</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">3 giờ trước</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-[16px] bg-warning/5 border border-warning/20">
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Bàn phím cơ Keychron</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">20 cái • Đơn hàng online #12345</p>
            </div>
            <div className="text-right">
              <p className="text-warning font-bold">-20</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">1 ngày trước</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
