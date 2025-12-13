/** Stock_InOut_Page.tsx - Nhập/Xuất kho */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetStockTransactions, StockTransaction } from '../../app/api_client';
import { useUIStore } from '../../state/ui_store';

export default function Stock_InOut_Page() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  useEffect(() => {
    apiGetStockTransactions()
      .then(setTransactions)
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">Nhập/Xuất kho</h1>
          <p className="text-[var(--text-3)] text-sm mt-1">Quản lý giao dịch kho hàng</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/stock/in')}
            className="bg-success text-white px-6 py-3 rounded-[var(--radius-lg)] font-medium transition-all duration-[180ms] hover:opacity-90 active:scale-[0.98]"
          >
            Nhập kho
          </button>
          <button 
            onClick={() => navigate('/stock/out')}
            className="bg-warning text-white px-6 py-3 rounded-[var(--radius-lg)] font-medium transition-all duration-[180ms] hover:opacity-90 active:scale-[0.98]"
          >
            Xuất kho
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-[var(--surface-1)] rounded-[var(--radius-xl)] border border-[var(--border)]">
        <table className="min-w-full">
          <thead className="bg-[var(--surface-2)] border-b border-[var(--border)]">
            <tr>
              <th className="px-4 py-3 text-left text-[var(--text-2)] text-sm font-semibold">Thời gian</th>
              <th className="px-4 py-3 text-left text-[var(--text-2)] text-sm font-semibold">Loại</th>
              <th className="px-4 py-3 text-right text-[var(--text-2)] text-sm font-semibold">Mã hàng</th>
              <th className="px-4 py-3 text-right text-[var(--text-2)] text-sm font-semibold">Số lượng</th>
              <th className="px-4 py-3 text-left text-[var(--text-2)] text-sm font-semibold">Ghi chú</th>
              <th className="px-4 py-3 text-center text-[var(--text-2)] text-sm font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-[var(--text-3)]">Đang tải...</td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-[var(--text-3)]">Chưa có giao dịch nào</td>
              </tr>
            ) : (
              transactions.map(tran => (
                <tr key={tran.id} className="hover:bg-[var(--surface-2)] transition-all duration-[150ms] border-b border-[var(--border)]">
                  <td className="px-4 py-3 text-[var(--text-1)]">{new Date(tran.timestamp).toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-[var(--radius-xs)] font-bold text-xs ${tran.type === 'in' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {tran.type === 'in' ? 'Nhập kho' : 'Xuất kho'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-1)]">{tran.item_id}</td>
                  <td className="px-4 py-3 text-right text-[var(--text-1)]">{tran.quantity}</td>
                  <td className="px-4 py-3 text-[var(--text-1)]">{tran.note || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <button className="px-3 py-1.5 rounded-[var(--radius-sm)] bg-primary/10 border border-primary/30 text-primary font-medium transition-all duration-[180ms] hover:bg-primary/20 active:scale-[0.98]">Chi tiết</button>
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
