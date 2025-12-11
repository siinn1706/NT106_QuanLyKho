/** Stock_In_Page.tsx - Trang Nhập kho */

import { useState, useEffect } from 'react';
import { FaBox, FaCalendar, FaUser, FaFileAlt } from 'react-icons/fa';
import {
  apiCreateItem,
  apiGetItems,
  apiCreateStockTransaction,
  apiGetStockTransactions,
  Item,
  StockTransaction,
} from '../../app/api_client';

export default function Stock_In_Page() {
  const [formData, setFormData] = useState({
    itemName: '',
    itemCode: '',
    quantity: '',
    unit: '',
    supplier: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  // State quản lý loading, error, lịch sử
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  // Load lịch sử nhập kho
  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const [transactionsData, itemsData] = await Promise.all([
        apiGetStockTransactions(),
        apiGetItems(),
      ]);
      // Lọc chỉ lấy nhập (type='in') và sắp xếp mới nhất trước
      const inTransactions = transactionsData
        .filter(t => t.type === 'in')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10); // 10 giao dịch gần đây
      setTransactions(inTransactions);
      setItems(itemsData);
    } catch (err) {
      console.error('Lỗi tải lịch sử:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      let itemId: number;
      const existingItem = items.find(i => i.sku === formData.itemCode);

      if (existingItem) {
        itemId = Number(existingItem.id);
      } else {
        const newItem = await apiCreateItem({
          name: formData.itemName,
          sku: formData.itemCode,
          quantity: 0,
          unit: formData.unit,
          price: parseFloat(formData.price || '0') || 0,
          category: 'Hàng hoá',
          supplier_id: undefined,
        });
        itemId = Number(newItem.id);
      }

      // Tạo giao dịch nhập kho
      await apiCreateStockTransaction({
        type: 'in',
        item_id: itemId,
        quantity: Number(formData.quantity) || 0,
        note: formData.note || undefined,
      });

      setSuccess('Nhập kho thành công!');
      setFormData({
        itemName: '',
        itemCode: '',
        quantity: '',
        unit: '',
        supplier: '',
        price: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
      });

      await loadHistory();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      setError(msg);
      console.error('Lỗi nhập kho:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-zinc-500 dark:text-zinc-400">
        <span>Nhập/Xuất kho</span>
        <span className="mx-2">{'>'}</span>
        <span className="text-zinc-900 dark:text-white">Nhập kho</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Nhập kho</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Thêm hàng hoá mới vào kho
          </p>
        </div>
      </div>

      {/* Thông báo */}
      {error && (
        <div className="p-4 rounded-[16px] bg-red-100 dark:bg-red-900/30 border border-red-500 text-red-700 dark:text-red-200">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-[16px] bg-green-100 dark:bg-green-900/30 border border-green-500 text-green-700 dark:text-green-200">
          ✅ {success}
        </div>
      )}

      {/* Form */}
      <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="w-full px-4 py-3 border border-black/10 dark:border-white/10 rounded-[16px] liquid-glass dark:liquid-glass-dark text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-success shadow-ios transition-all"
                placeholder="Nhập tên hàng hoá"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Mã hàng
              </label>
              <input
                type="text"
                name="itemCode"
                value={formData.itemCode}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-black/10 dark:border-white/10 rounded-[16px] liquid-glass dark:liquid-glass-dark text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-success shadow-ios transition-all"
                placeholder="Mã SKU hoặc barcode"
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Số lượng
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-4 py-3 border border-black/10 dark:border-white/10 rounded-[16px] liquid-glass dark:liquid-glass-dark text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-success shadow-ios transition-all"
                placeholder="0"
              />
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
                className="w-full px-4 py-3 border border-black/10 dark:border-white/10 rounded-[16px] liquid-glass dark:liquid-glass-dark text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-success shadow-ios transition-all"
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

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Giá nhập (₫)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-4 py-3 border border-black/10 dark:border-white/10 rounded-[16px] liquid-glass dark:liquid-glass-dark text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-success shadow-ios transition-all"
                placeholder="0"
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                <FaUser className="inline mr-2" />
                Nhà cung cấp
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-black/10 dark:border-white/10 rounded-[16px] liquid-glass dark:liquid-glass-dark text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-success shadow-ios transition-all"
                placeholder="Tên nhà cung cấp"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                <FaCalendar className="inline mr-2" />
                Ngày nhập
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-black/10 dark:border-white/10 rounded-[16px] liquid-glass dark:liquid-glass-dark text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-success shadow-ios transition-all"
              />
            </div>
          </div>

          {/* Row 4 */}
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
              className="w-full px-4 py-3 border border-black/10 dark:border-white/10 rounded-[16px] liquid-glass dark:liquid-glass-dark text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-success shadow-ios transition-all resize-none"
              placeholder="Ghi chú thêm về lô hàng (tùy chọn)"
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
              className="px-8 py-3 rounded-[20px] bg-success text-white font-medium hover:scale-105 transition-transform shadow-ios hover:bg-success/90 backdrop-blur-sm"
            >
              Xác nhận nhập kho
            </button>
          </div>
        </form>
      </div>

      {/* Recent Imports */}
      <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Lịch sử nhập kho gần đây
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-[16px] bg-success/5 border border-success/20">
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Laptop Dell XPS 15</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">50 cái • NCC TechWorld</p>
            </div>
            <div className="text-right">
              <p className="text-success font-bold">+50</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">2 giờ trước</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-[16px] bg-success/5 border border-success/20">
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">iPhone 15 Pro Max</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">30 cái • NCC Mobile Store</p>
            </div>
            <div className="text-right">
              <p className="text-success font-bold">+30</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">5 giờ trước</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-[16px] bg-success/5 border border-success/20">
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Bàn phím cơ Keychron</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">100 cái • NCC Gear Shop</p>
            </div>
            <div className="text-right">
              <p className="text-success font-bold">+100</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">1 ngày trước</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
