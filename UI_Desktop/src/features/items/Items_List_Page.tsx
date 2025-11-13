/** Items_List_Page.tsx - Danh sách hàng hoá */

import { useEffect, useState } from 'react';
import { apiGetItems, Item } from '../../app/api_client';

export default function Items_List_Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetItems()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Danh sách hàng hoá</h1>
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm hàng hoá..."
          className="w-64 px-4 py-2 border rounded-lg bg-zinc-100 dark:bg-zinc-900 focus:ring-2 focus:ring-primary"
        />
        <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition">Thêm hàng hoá</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3 text-left">Tên hàng</th>
              <th className="px-4 py-3 text-left">Mã SKU</th>
              <th className="px-4 py-3 text-right">Số lượng</th>
              <th className="px-4 py-3 text-right">Đơn vị</th>
              <th className="px-4 py-3 text-right">Giá</th>
              <th className="px-4 py-3 text-right">Danh mục</th>
              <th className="px-4 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-zinc-500">Đang tải...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-zinc-500">Không có hàng hoá nào</td>
              </tr>
            ) : (
              items.map(item => (
                <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition">
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.sku}</td>
                  <td className="px-4 py-3 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">{item.unit}</td>
                  <td className="px-4 py-3 text-right">{item.price?.toLocaleString()}₫</td>
                  <td className="px-4 py-3 text-right">{item.category}</td>
                  <td className="px-4 py-3 text-center">
                    <button className="px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 mr-2">Sửa</button>
                    <button className="px-3 py-1 rounded-lg bg-danger/10 text-danger hover:bg-danger/20">Xoá</button>
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
