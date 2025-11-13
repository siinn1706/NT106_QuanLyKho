/** Suppliers_Page.tsx - Quản lý nhà cung cấp */

import { useEffect, useState } from 'react';
import { apiGetSuppliers, Supplier } from '../../app/api_client';

export default function Suppliers_Page() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetSuppliers()
      .then(setSuppliers)
      .catch(() => setSuppliers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nhà cung cấp</h1>
      <div className="flex justify-end mb-4">
        <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition">Thêm NCC</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3 text-left">Tên NCC</th>
              <th className="px-4 py-3 text-left">Liên hệ</th>
              <th className="px-4 py-3 text-left">Địa chỉ</th>
              <th className="px-4 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-zinc-500">Đang tải...</td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-zinc-500">Chưa có nhà cung cấp nào</td>
              </tr>
            ) : (
              suppliers.map(sup => (
                <tr key={sup.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition">
                  <td className="px-4 py-3">{sup.name}</td>
                  <td className="px-4 py-3">{sup.contact}</td>
                  <td className="px-4 py-3">{sup.address}</td>
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
