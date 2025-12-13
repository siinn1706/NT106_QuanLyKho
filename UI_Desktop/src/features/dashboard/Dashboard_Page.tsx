/** Dashboard_Page.tsx - Màn hình trang chủ
 *  - Hiển thị các thống kê tổng quan: tổng số hàng hoá, cảnh báo hàng sắp hết, tổng giá trị kho.
 *  - Bảng giao dịch gần đây (nhập/xuất kho).
 *  - Biểu đồ trạng thái hàng hoá (có thể thêm sau).
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetDashboardStats, DashboardStats } from '../../app/api_client';
import Icon from '../../components/ui/Icon';
import CustomSelect from '../../components/ui/CustomSelect';

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
          <div className="w-16 h-16 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-3)]">Đang tải dữ liệu...</p>
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
      {/* Stats Cards - KHÔNG shadow, border-based depth */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Uptime */}
        <div 
          onClick={() => navigate('/reports')}
          className="bg-[var(--surface-1)] rounded-[var(--radius-2xl)] border border-[var(--border)] p-6 transition-colors duration-150 hover:border-[var(--border-hover)] cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--text-3)]">
              Hiệu suất hệ thống
            </h3>
            <span className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--success-light)]">
              <Icon name="stats" size="lg" className="text-[var(--success)]" />
            </span>
          </div>
          <p className="text-4xl font-bold text-[var(--success)] mb-2">{safeStats.system_uptime || 0}%</p>
          <p className="text-sm text-[var(--text-3)]">
            Uptime trong 7 ngày qua
          </p>
        </div>

        {/* Card 2: Issues */}
        <div 
          onClick={() => navigate('/items/alerts')}
          className="bg-[var(--surface-1)] rounded-[var(--radius-2xl)] border border-[var(--border)] p-6 transition-colors duration-150 hover:border-[var(--border-hover)] cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--text-3)]">
              Cảnh báo hàng tồn kho
            </h3>
            <span className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--danger-light)]">
              <Icon name="warning" size="lg" className="text-[var(--danger)]" />
            </span>
          </div>
          <p className="text-4xl font-bold text-[var(--danger)] mb-2">{safeStats.low_stock_count}</p>
          <p className="text-sm text-[var(--text-3)]">
            Hàng hoá cần nhập thêm
          </p>
        </div>

        {/* Card 3: Usage */}
        <div 
          onClick={() => navigate('/items/tracking')}
          className="bg-[var(--surface-1)] rounded-[var(--radius-2xl)] border border-[var(--border)] p-6 transition-colors duration-150 hover:border-[var(--border-hover)] cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--text-3)]">
              Tỷ lệ sử dụng kho
            </h3>
            <span className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-light)]">
              <Icon name="archive" size="lg" className="text-[var(--primary)]" />
            </span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <p className="text-4xl font-bold">{safeStats.warehouse_usage || 0}%</p>
            <div className="flex-1 mb-2">
              <div className="h-3 bg-[var(--surface-2)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--success)] rounded-full transition-all duration-300" style={{ width: `${safeStats.warehouse_usage || 0}%` }}></div>
              </div>
            </div>
          </div>
          <p className="text-sm text-[var(--text-3)]">
            Công suất hiện tại
          </p>
        </div>
      </div>

      {/* Equipment and Inventory Status Table - KHÔNG shadow */}
      <div className="bg-[var(--surface-1)] rounded-[var(--radius-2xl)] border border-[var(--border)]">
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-xl font-semibold">Trạng thái Hàng hoá và Tồn kho</h2>
          <div className="flex gap-2 relative z-10">
            <CustomSelect
              value={selectedCategory}
              onChange={setSelectedCategory}
              size="sm"
              options={[
                { value: 'all', label: 'Tất cả danh mục' },
                { value: 'raw', label: 'Nguyên liệu' },
                { value: 'finished', label: 'Thành phẩm' },
                { value: 'semi', label: 'Bán thành phẩm' },
              ]}
            />
            <CustomSelect
              value={timeRange}
              onChange={setTimeRange}
              size="sm"
              options={[
                { value: '7days', label: '7 ngày qua' },
                { value: '15days', label: '15 ngày qua' },
                { value: '30days', label: '30 ngày qua' },
                { value: 'prev-month', label: 'Tháng trước' },
              ]}
            />
          </div>
        </div>

        {/* Table - KHÔNG shadow, border-based */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--surface-2)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-3)] uppercase tracking-wider">
                  STT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-3)] uppercase tracking-wider">
                  Tiêu đề
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-3)] uppercase tracking-wider">
                  Ghi chú
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-3)] uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-3)] uppercase tracking-wider">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {safeStats.recent_transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-[var(--text-3)]">
                    Chưa có giao dịch nào
                  </td>
                </tr>
              ) : (
                safeStats.recent_transactions.map((txn, index) => (
                  <tr key={txn.id} className="hover:bg-[var(--surface-2)] transition-colors duration-100">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {txn.type === 'in' ? 'Nhập kho' : 'Xuất kho'} - Item {txn.item_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-2)]">
                      {txn.note || `Số lượng: ${txn.quantity}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(txn.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-[var(--radius-sm)] ${txn.type === 'in' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'}`}>
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

      {/* Equipment Status Cards - KHÔNG shadow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Laboratory Equipment Status */}
        <div className="bg-[var(--surface-1)] rounded-[var(--radius-2xl)] border border-[var(--border)] p-6 transition-all duration-150 hover:border-[var(--border-hover)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Trạng thái Kho Nguyên liệu</h3>
            <div className="w-3 h-3 bg-[var(--success)] rounded-full"></div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--text-2)]">Mức độ sử dụng</span>
                <span className="font-semibold">0%</span>
              </div>
              <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--success)] rounded-full transition-all duration-300" style={{ width: '0%' }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[var(--text-3)]">Lần bảo trì cuối</p>
                <p className="font-semibold">N/A</p>
              </div>
              <div>
                <p className="text-[var(--text-3)]">Bảo trì tiếp theo</p>
                <p className="font-semibold">N/A</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card: Radiology Equipment Maintenance */}
        <div className="bg-[var(--surface-1)] rounded-[var(--radius-2xl)] border border-[var(--border)] p-6 transition-all duration-150 hover:border-[var(--border-hover)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Trạng thái Kho Thành phẩm</h3>
            <div className="w-3 h-3 bg-[var(--text-3)] rounded-full"></div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--text-2)]">Bảo trì Máy đóng gói</span>
                <span className="font-semibold">0%</span>
              </div>
              <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--text-3)] rounded-full transition-all duration-300" style={{ width: '0%' }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[var(--text-3)]">Lần bảo trì cuối</p>
                <p className="font-semibold">N/A</p>
              </div>
              <div>
                <p className="text-[var(--text-3)]">Đã lên lịch</p>
                <p className="font-semibold">N/A</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
