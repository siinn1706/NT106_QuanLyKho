/** Stock_Out_Page.tsx - Trang Xuất kho */

import { useState, useEffect } from 'react';
import { FaBox, FaCalendar, FaUser, FaFileAlt, FaSearch } from 'react-icons/fa';
import {
  apiGetItems,
  apiGetStockTransactions,
  apiCreateStockTransaction,
  Item,
  StockTransaction,
} from '../../app/api_client';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  // Load lịch sử xuất kho
  useEffect(() => {
    loadHistory();
  }, []);

  // Auto-dismiss success/error messages
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
      // Lọc chỉ lấy xuất (type='out') và sắp xếp mới nhất trước
      const outTransactions = transactionsData
        .filter(t => t.type === 'out')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
      setTransactions(outTransactions);
      setItems(itemsData);
    } catch (err) {
      console.error('Lỗi tải lịch sử:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSearchItem = async () => {
    setError('');
    setAvailableStock(null);
    setSelectedItemId(null);

    if (!formData.itemCode.trim()) {
      setError('Vui lòng nhập mã hàng');
      return;
    }

    try {
      // Tìm item theo SKU
      const foundItem = items.find(i => i.sku.toLowerCase() === formData.itemCode.toLowerCase());
      if (!foundItem) {
        setError('Không tìm thấy hàng hoá với mã này');
        return;
      }

      // Đặt thông tin item
      setFormData(prev => ({
        ...prev,
        itemName: foundItem.name,
        unit: foundItem.unit,
      }));
      setAvailableStock(foundItem.quantity);
      setSelectedItemId(Number(foundItem.id));
      setSuccess(`Tìm thấy: ${foundItem.name} (Tồn: ${foundItem.quantity} ${foundItem.unit})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi tìm kiếm';
      setError(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!selectedItemId) {
        setError('Vui lòng tìm kiếm và chọn hàng hoá trước');
        setIsLoading(false);
        return;
      }

      const quantity = Number(formData.quantity) || 0;
      if (quantity <= 0) {
        setError('Số lượng xuất phải > 0');
        setIsLoading(false);
        return;
      }

      if (availableStock !== null && quantity > availableStock) {
        setError(`Không đủ hàng trong kho! Tồn kho hiện tại: ${availableStock}`);
        setIsLoading(false);
        return;
      }

      // Tạo giao dịch xuất kho
      await apiCreateStockTransaction({
        type: 'out',
        item_id: selectedItemId,
        quantity: quantity,
        note: formData.note || undefined,
      });

      setSuccess('Xuất kho thành công!');
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
      setSelectedItemId(null);

      // Reload lịch sử và items
      await loadHistory();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      setError(msg);
      console.error('Lỗi xuất kho:', err);
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

  // Helper: format thời gian tương đối
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
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

      {/* Stock Alert */}
      {availableStock !== null && (
        <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-info/30 bg-info/10 p-4">
          <div className="flex items-center gap-3">
            <FaBox className="text-info text-xl" />
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                Tồn kho hiện tại: <span className="text-info font-bold">{availableStock}</span> {formData.unit}
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
                  className="px-4 py-3 rounded-[16px] bg-primary text-white hover:scale-105 transition-transform shadow-ios disabled:opacity-50"
                  disabled={isLoading}
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
                readOnly
                className="w-full px-4 py-3 border border-black/10 dark:border-white/10 rounded-[16px] liquid-glass dark:liquid-glass-dark text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-warning shadow-ios transition-all bg-zinc-100 dark:bg-zinc-800"
                placeholder="Tên hàng hoá (auto-fill)"
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
              <input
                type="text"
                value={formData.unit}
                readOnly
                className="w-full px-4 py-3 border border-black/10 dark:border-white/10 rounded-[16px] liquid-glass dark:liquid-glass-dark text-zinc-900 dark:text-zinc-100 shadow-ios bg-zinc-100 dark:bg-zinc-800"
                placeholder="Đơn vị (auto-fill)"
              />
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
              className="px-6 py-3 rounded-[20px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:scale-105 transition-transform shadow-ios disabled:opacity-50"
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-8 py-3 rounded-[20px] bg-warning text-white font-medium hover:scale-105 transition-transform shadow-ios hover:bg-warning/90 backdrop-blur-sm disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Đang xử lý...' : 'Xác nhận xuất kho'}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Exports */}
      <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Lịch sử xuất kho gần đây
        </h2>
        {isLoadingHistory ? (
          <div className="text-center py-8 text-zinc-500">Đang tải lịch sử...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">Chưa có lịch sử xuất kho</div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const item = items.find(i => String(i.id) === String(tx.item_id));
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-[16px] bg-warning/5 border border-warning/20"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {item?.name || `Item #${tx.item_id}`}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {tx.quantity} {item?.unit || 'cái'} • {tx.note || 'Không có ghi chú'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-warning font-bold">-{tx.quantity}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatTimeAgo(tx.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}