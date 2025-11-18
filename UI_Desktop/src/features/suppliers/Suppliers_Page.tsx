/** Suppliers_Page.tsx - Quản lý nhà cung cấp */

import { useEffect, useState } from 'react';
import { apiGetSuppliers, Supplier } from '../../app/api_client';
import { useUIStore } from '../../state/ui_store';

export default function Suppliers_Page() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  useEffect(() => {
    apiGetSuppliers()
      .then(setSuppliers)
      .catch(() => setSuppliers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Nhà cung cấp</h1>
      <div className="flex justify-end mb-4">
        <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition">Thêm NCC</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-zinc-900 dark:text-zinc-100">Tên NCC</th>
              <th className="px-4 py-3 text-left text-zinc-900 dark:text-zinc-100">Liên hệ</th>
              <th className="px-4 py-3 text-left text-zinc-900 dark:text-zinc-100">Địa chỉ</th>
              <th className="px-4 py-3 text-center text-zinc-900 dark:text-zinc-100">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-zinc-500 dark:text-zinc-400">Đang tải...</td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-zinc-500 dark:text-zinc-400">Chưa có nhà cung cấp nào</td>
              </tr>
            ) : (
              suppliers.map(sup => (
                <tr key={sup.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition border-b border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{sup.name}</td>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{sup.contact}</td>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{sup.address}</td>
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
