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
          className="w-64 px-4 py-3 border border-black/10 dark:border-white/10 rounded-[20px] liquid-glass dark:liquid-glass-dark text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-primary shadow-ios transition-all"
        />
        <button className="bg-success text-white px-6 py-3 rounded-[20px] hover:scale-105 transition-transform shadow-ios font-medium hover:bg-success/90 backdrop-blur-sm">
          Thêm hàng hoá
        </button>
      </div>
      <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="liquid-glass-ui dark:liquid-glass-ui-dark border-b border-black/10 dark:border-white/10">
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
                <tr key={item.id} className="hover:liquid-glass-ui dark:hover:liquid-glass-ui-dark transition-all border-b border-black/10 dark:border-white/10">
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{item.name}</td>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{item.sku}</td>
                  <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100">{item.unit}</td>
                  <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100">{item.price?.toLocaleString()}₫</td>
                  <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100">{item.category}</td>
                  <td className="px-4 py-3 text-center">
                    <button className="px-3 py-1.5 rounded-[16px] bg-primary/10 dark:bg-primary/20 border border-primary/30 text-primary shadow-ios transition-transform hover:scale-105 hover:bg-primary/20 dark:hover:bg-primary/30 mr-2 font-medium">Sửa</button>
                    <button className="px-3 py-1.5 rounded-[16px] bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-500 shadow-ios transition-transform hover:scale-105 hover:bg-red-500/20 dark:hover:bg-red-500/30 font-medium">Xoá</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
