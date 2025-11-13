/** Stock_InOut_Page.tsx - Nhập/Xuất kho */

import { useEffect, useState } from 'react';
import { apiGetStockTransactions, StockTransaction } from '../../app/api_client';

export default function Stock_InOut_Page() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetStockTransactions()
      .then(setTransactions)
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nhập/Xuất kho</h1>
      <div className="flex justify-between items-center mb-4">
        <button className="bg-success text-white px-4 py-2 rounded-lg hover:bg-success/90 mr-2">Nhập kho</button>
        <button className="bg-warning text-white px-4 py-2 rounded-lg hover:bg-warning/90">Xuất kho</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3 text-left">Thời gian</th>
              <th className="px-4 py-3 text-left">Loại</th>
              <th className="px-4 py-3 text-right">Mã hàng</th>
              <th className="px-4 py-3 text-right">Số lượng</th>
              <th className="px-4 py-3 text-left">Ghi chú</th>
              <th className="px-4 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-zinc-500">Đang tải...</td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-zinc-500">Chưa có giao dịch nào</td>
              </tr>
            ) : (
              transactions.map(tran => (
                <tr key={tran.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition">
                  <td className="px-4 py-3">{new Date(tran.timestamp).toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full font-bold text-xs ${tran.type === 'in' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {tran.type === 'in' ? 'Nhập kho' : 'Xuất kho'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{tran.item_id}</td>
                  <td className="px-4 py-3 text-right">{tran.quantity}</td>
                  <td className="px-4 py-3">{tran.note || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <button className="px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 mr-2">Chi tiết</button>
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
