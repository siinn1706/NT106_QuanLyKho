/** Dashboard_Page.tsx - Màn hình trang chủ
 *  - Hiển thị các thống kê tổng quan: tổng số hàng hoá, cảnh báo hàng sắp hết, tổng giá trị kho.
 *  - Bảng giao dịch gần đây (nhập/xuất kho).
 *  - Biểu đồ trạng thái hàng hoá (có thể thêm sau).
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetDashboardStats, DashboardStats } from '../../app/api_client';

export default function Dashboard_Page() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeRange, setTimeRange] = useState('7days');

  useEffect(() => {
    // Load stats từ BE
    apiGetDashboardStats()
      .then(setStats)
      .catch((err) => console.error('Lỗi khi tải dashboard stats:', err))
      .finally(() => setLoading(false));
    /* Expected JSON structure from BE:
    {
      "total_items": 245,
      "low_stock_count": 14,
      "total_value": 156000000,
      "system_uptime": 96,
      "warehouse_usage": 78,
      "recent_transactions": [
        {
          "id": "TXN001",
          "item_name": "Laptop Dell XPS",
          "type": "Nhập kho",
          "quantity": 10,
          "date": "2024-01-15",
          "status": "Hoàn thành"
        }
      ]
    }
    */
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-500 dark:text-zinc-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Nếu API fail thì dùng giá trị mặc định 0
  const safeStats = stats || {
    total_items: 0,
    low_stock_count: 0,
    total_value: 0,
    recent_transactions: [],
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Uptime */}
        <div 
          onClick={() => navigate('/reports')}
          className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 p-6 shadow-ios transition-transform hover:scale-[1.02] cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Hiệu suất hệ thống
            </h3>
            <span className="text-2xl">📈</span>
          </div>
          <p className="text-4xl font-bold text-success mb-2">{safeStats.system_uptime || 0}%</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Uptime trong 7 ngày qua
          </p>
        </div>

        {/* Card 2: Issues */}
        <div 
          onClick={() => navigate('/items/alerts')}
          className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 p-6 shadow-ios transition-all hover:scale-[1.02] cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Cảnh báo hàng tồn kho
            </h3>
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-4xl font-bold text-danger mb-2">{safeStats.low_stock_count}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Hàng hoá cần nhập thêm
          </p>
        </div>

        {/* Card 3: Usage */}
        <div 
          onClick={() => navigate('/items/tracking')}
          className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 p-6 shadow-ios transition-all hover:scale-[1.02] cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Tỷ lệ sử dụng kho
            </h3>
            <span className="text-2xl">📦</span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <p className="text-4xl font-bold">{safeStats.warehouse_usage || 0}%</p>
            <div className="flex-1 mb-2">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: `${safeStats.warehouse_usage || 0}%` }}></div>
              </div>
            </div>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Công suất hiện tại
          </p>
        </div>
      </div>

      {/* Equipment and Inventory Status Table */}
      <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios overflow-hidden">
        <div className="p-6 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Trạng thái Hàng hoá và Tồn kho</h2>
          <div className="flex gap-2">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 liquid-glass-ui dark:liquid-glass-ui-dark border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/30 text-sm shadow-ios transition-all hover:scale-[1.02]"
            >
              <option value="all">Tất cả danh mục</option>
              <option value="raw">Nguyên liệu</option>
              <option value="finished">Thành phẩm</option>
              <option value="semi">Bán thành phẩm</option>
            </select>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 liquid-glass-ui dark:liquid-glass-ui-dark border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/30 text-sm shadow-ios transition-all hover:scale-[1.02]"
            >
              <option value="7days">7 ngày qua</option>
              <option value="15days">15 ngày qua</option>
              <option value="30days">30 ngày qua</option>
              <option value="prev-month">Tháng trước</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="liquid-glass-ui dark:liquid-glass-ui-dark">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  STT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Tiêu đề
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Ghi chú
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {safeStats.recent_transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Chưa có giao dịch nào
                  </td>
                </tr>
              ) : (
                safeStats.recent_transactions.map((txn, index) => (
                  <tr key={txn.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {txn.type === 'in' ? 'Nhập kho' : 'Xuất kho'} - Item {txn.item_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                      {txn.note || `Số lượng: ${txn.quantity}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(txn.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${txn.type === 'in' ? 'bg-success/10 text-success' : 'bg-info/10 text-info'}`}>
                        {txn.type === 'in' ? 'Nhập kho' : 'Xuất kho'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Equipment Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Laboratory Equipment Status */}
        <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 p-6 shadow-ios transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Trạng thái Kho Nguyên liệu</h3>
            <div className="w-3 h-3 bg-success rounded-full"></div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-600 dark:text-zinc-400">Mức độ sử dụng</span>
                <span className="font-semibold">0%</span>
              </div>
              <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Lần bảo trì cuối</p>
                <p className="font-semibold">N/A</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Bảo trì tiếp theo</p>
                <p className="font-semibold">N/A</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card: Radiology Equipment Maintenance */}
        <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 p-6 shadow-ios transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Trạng thái Kho Thành phẩm</h3>
            <div className="w-3 h-3 bg-zinc-400 rounded-full"></div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-600 dark:text-zinc-400">Bảo trì Máy đóng gói</span>
                <span className="font-semibold">0%</span>
              </div>
              <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-400 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Lần bảo trì cuối</p>
                <p className="font-semibold">N/A</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Đã lên lịch</p>
                <p className="font-semibold">N/A</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
