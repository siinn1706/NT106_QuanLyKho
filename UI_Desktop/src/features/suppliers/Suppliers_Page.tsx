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
        <button className="bg-success text-white px-6 py-3 rounded-[20px] hover:scale-105 transition-transform shadow-ios font-medium hover:bg-success/90 backdrop-blur-sm">
          Thêm NCC
        </button>
      </div>
      <div className="overflow-x-auto liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios">
        <table className="min-w-full">
          <thead className="liquid-glass-ui dark:liquid-glass-ui-dark">
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
                <tr key={sup.id} className="hover:liquid-glass-ui dark:hover:liquid-glass-ui-dark transition-all border-b border-black/10 dark:border-white/10">
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{sup.name}</td>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{sup.contact}</td>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{sup.address}</td>
                  <td className="px-4 py-3 text-center">
                    <button className="px-3 py-1.5 rounded-[16px] bg-primary/10 dark:bg-primary/20 border border-primary/30 text-primary hover:scale-105 transition-transform shadow-ios font-medium mr-2 hover:bg-primary/20 dark:hover:bg-primary/30">Sửa</button>
                    <button className="px-3 py-1.5 rounded-[16px] bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-500 hover:scale-105 transition-transform shadow-ios font-medium hover:bg-red-500/20 dark:hover:bg-red-500/30">Xoá</button>
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
