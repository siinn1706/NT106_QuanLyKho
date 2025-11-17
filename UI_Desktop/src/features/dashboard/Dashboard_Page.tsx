/** Dashboard_Page.tsx - Màn hình trang chủ
 *  - Hiển thị các thống kê tổng quan: tổng số hàng hoá, cảnh báo hàng sắp hết, tổng giá trị kho.
 *  - Bảng giao dịch gần đây (nhập/xuất kho).
 *  - Biểu đồ trạng thái hàng hoá (có thể thêm sau).
 */

import { useEffect, useState } from 'react';
import { apiGetDashboardStats, DashboardStats } from '../../app/api_client';

export default function Dashboard_Page() {
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

  // Dữ liệu giả để demo UI (nếu BE chưa có)
  const mockStats: DashboardStats = stats || {
    total_items: 245,
    low_stock_count: 14,
    total_value: 156780000,
    recent_transactions: [
      {
        id: '1',
        type: 'in',
        item_id: 'item-1',
        quantity: 50,
        timestamp: '2025-11-13T10:00:00Z',
        note: 'Nhập hàng từ NCC ABC',
      },
      {
        id: '2',
        type: 'out',
        item_id: 'item-2',
        quantity: 20,
        timestamp: '2025-11-13T09:30:00Z',
        note: 'Xuất hàng cho đơn #12345',
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Uptime */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Hiệu suất hệ thống
            </h3>
            <span className="text-2xl">📈</span>
          </div>
          <p className="text-4xl font-bold text-success mb-2">96%</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Uptime trong 7 ngày qua
          </p>
        </div>

        {/* Card 2: Issues */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Cảnh báo hàng tồn kho
            </h3>
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-4xl font-bold text-danger mb-2">{mockStats.low_stock_count}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Hàng hoá cần nhập thêm
          </p>
        </div>

        {/* Card 3: Usage */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Tỷ lệ sử dụng kho
            </h3>
            <span className="text-2xl">📦</span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <p className="text-4xl font-bold">78%</p>
            <div className="flex-1 mb-2">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Công suất hiện tại
          </p>
        </div>
      </div>

      {/* Equipment and Inventory Status Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Trạng thái Hàng hoá và Tồn kho</h2>
          <div className="flex gap-2">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="all">Tất cả danh mục</option>
              <option value="raw">Nguyên liệu</option>
              <option value="finished">Thành phẩm</option>
              <option value="semi">Bán thành phẩm</option>
            </select>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
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
            <thead className="bg-zinc-100 dark:bg-zinc-900/50">
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
              <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm">1</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  Bảo trì máy đóng gói quá hạn
                </td>
                <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                  Bảo trì quá hạn 3 ngày
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  13/11/2025 - 10:00
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-danger/10 text-danger">
                    Khẩn cấp
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm">2</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  Hàng tồn kho thấp: Ốc vít M8
                </td>
                <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                  Chỉ còn 5 hộp trong kho
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  13/11/2025 - 09:30
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-warning/10 text-warning">
                    Cảnh báo
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm">3</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  Nhập kho mới cho nguyên liệu X
                </td>
                <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                  Đã nhập 50 đơn vị vào kho
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  13/11/2025 - 09:00
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-success/10 text-success">
                    Hoàn thành
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Equipment Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Laboratory Equipment Status */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Trạng thái Kho Nguyên liệu</h3>
            <div className="w-3 h-3 bg-success rounded-full"></div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-600 dark:text-zinc-400">Mức độ sử dụng</span>
                <span className="font-semibold">70%</span>
              </div>
              <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Lần bảo trì cuối</p>
                <p className="font-semibold">08/12/2024</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Bảo trì tiếp theo</p>
                <p className="font-semibold">01/01/2026</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card: Radiology Equipment Maintenance */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Trạng thái Kho Thành phẩm</h3>
            <div className="w-3 h-3 bg-danger rounded-full"></div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-600 dark:text-zinc-400">Bảo trì Máy đóng gói</span>
                <span className="font-semibold">60%</span>
              </div>
              <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-danger rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Lần bảo trì cuối</p>
                <p className="font-semibold">08/12/2024</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Đã lên lịch</p>
                <p className="font-semibold text-danger">08/12/2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
