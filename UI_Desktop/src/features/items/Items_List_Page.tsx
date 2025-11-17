/** Items_List_Page.tsx - Danh sách hàng hoá */

import { useEffect, useState } from 'react';
import { apiGetItems, Item } from '../../app/api_client';
import { useUIStore } from '../../state/ui_store';

export default function Items_List_Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  useEffect(() => {
    apiGetItems()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Danh sách hàng hoá</h1>
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm hàng hoá..."
          className="w-64 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-primary"
        />
        <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition">Thêm hàng hoá</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-zinc-900 dark:text-zinc-100">Tên hàng</th>
              <th className="px-4 py-3 text-left text-zinc-900 dark:text-zinc-100">Mã SKU</th>
              <th className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100">Số lượng</th>
              <th className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100">Đơn vị</th>
              <th className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100">Giá</th>
              <th className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100">Danh mục</th>
              <th className="px-4 py-3 text-center text-zinc-900 dark:text-zinc-100">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-zinc-500 dark:text-zinc-400">Đang tải...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-zinc-500 dark:text-zinc-400">Không có hàng hoá nào</td>
              </tr>
            ) : (
              items.map(item => (
                <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition border-b border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{item.name}</td>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{item.sku}</td>
                  <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100">{item.unit}</td>
                  <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100">{item.price?.toLocaleString()}₫</td>
                  <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100">{item.category}</td>
                  <td className="px-4 py-3 text-center">
                    <button className="px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 mr-2">Sửa</button>
                    <button className="px-3 py-1 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20">Xoá</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
