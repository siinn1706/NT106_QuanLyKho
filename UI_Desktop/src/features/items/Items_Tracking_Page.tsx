/** Items_Tracking_Page.tsx - Theo dõi hàng hoá với biểu đồ */

import { useEffect, useState } from 'react';
import { apiGetItems, Item } from '../../app/api_client';
import { useUIStore } from '../../state/ui_store';

export default function Items_Tracking_Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeRange, setTimeRange] = useState('7days');
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  useEffect(() => {
    apiGetItems()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const [topItems, setTopItems] = useState<{name: string; value: number}[]>([]);
  const [monthlyData, setMonthlyData] = useState<{month: string; value: number}[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<{name: string; value: number; color: string}[]>([]);

  useEffect(() => {
    // Fetch chart data from API
    const fetchChartData = async () => {
      try {
        const [topRes, monthlyRes, categoryRes] = await Promise.all([
          fetch('http://localhost:8000/items/top-items'),
          fetch('http://localhost:8000/items/monthly-trend'),
          fetch('http://localhost:8000/items/category-distribution')
        ]);
        
        if (topRes.ok) setTopItems(await topRes.json());
        /* Expected JSON structure from BE (GET /items/top-items):
        [
          {
            "name": "Laptop Dell XPS 15",
            "value": 150
          },
          {
            "name": "iPhone 15 Pro",
            "value": 120
          }
        ]
        */
        
        if (monthlyRes.ok) setMonthlyData(await monthlyRes.json());
        /* Expected JSON structure from BE (GET /items/monthly-trend):
        [
          {
            "month": "T1",
            "value": 120
          },
          {
            "month": "T2",
            "value": 150
          }
        ]
        */
        
        if (categoryRes.ok) setCategoryDistribution(await categoryRes.json());
        /* Expected JSON structure from BE (GET /items/category-distribution):
        [
          {
            "name": "Điện tử",
            "value": 450,
            "color": "#00BCD4"
          },
          {
            "name": "Thực phẩm",
            "value": 320,
            "color": "#4CAF50"
          }
        ]
        */
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };
    
    fetchChartData();
  }, []);

  const getStockStatus = (quantity: number): { label: string; color: string; progress: number } => {
    if (quantity > 100) return { label: 'Đầy đủ', color: 'success', progress: 80 };
    if (quantity > 50) return { label: 'Trung bình', color: 'warning', progress: 50 };
    return { label: 'Thấp', color: 'danger', progress: 20 };
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Theo dõi Hàng hoá</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Tồn kho, Nhập lại, Sắp hết hạn
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios transition-all hover:scale-[1.02] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">{items.length.toLocaleString()}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Tổng số mặt hàng</p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
          <button className="text-primary text-sm hover:underline flex items-center gap-1">
            Xem chi tiết
            <span>→</span>
          </button>
        </div>

        <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios transition-all hover:scale-[1.02] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-4xl font-bold text-warning dark:text-warning">0</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Cần nhập lại</p>
              <p className="text-xs text-warning mt-1">Cảnh báo quan trọng</p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
          <button className="text-primary text-sm hover:underline flex items-center gap-1">
            Xem chi tiết
            <span>→</span>
          </button>
        </div>

        <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios transition-all hover:scale-[1.02] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-4xl font-bold text-info dark:text-info">0</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Sắp hết hạn</p>
              <p className="text-xs text-info mt-1">Gần hết hạn sử dụng</p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
          <button className="text-primary text-sm hover:underline flex items-center gap-1">
            Xem chi tiết
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Items */}
        <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios transition-all hover:scale-[1.02] p-6">
          <h3 className="text-lg font-semibold mb-6 text-zinc-900 dark:text-zinc-100">Top 5 hàng xuất nhiều nhất</h3>
          <div className="space-y-4">
            {topItems.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">Chưa có dữ liệu</p>
            ) : (
              topItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 w-6">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.name}</span>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">{item.value}</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                      <div 
                        className="bg-success rounded-full h-2" 
                        style={{ width: `${Math.min((item.value / 160) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios transition-all hover:scale-[1.02] p-6">
          <h3 className="text-lg font-semibold mb-6 text-zinc-900 dark:text-zinc-100">Xu hướng tồn kho theo tháng</h3>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">Chưa có dữ liệu</p>
          ) : (
            <div className="flex items-end justify-between h-48 gap-2">
              {monthlyData.map((data, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-t relative" style={{ height: '100%' }}>
                    <div 
                      className="absolute bottom-0 w-full bg-warning rounded-t transition-all"
                      style={{ height: `${Math.min((data.value / 40000) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">{data.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table with Filters */}
      <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios transition-all hover:scale-[1.02]">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Danh sách theo dõi</h2>
          <div className="flex gap-2">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 liquid-glass-ui dark:liquid-glass-ui-dark border border-black/10 dark:border-white/10 rounded-xl shadow-ios transition-all hover:scale-[1.02] focus:outline-none focus:ring-1 focus:ring-primary/30 text-sm text-zinc-900 dark:text-zinc-100"
            >
              <option value="all">Tất cả danh mục</option>
              <option value="raw">Nguyên liệu</option>
              <option value="tools">Công cụ</option>
              <option value="parts">Phụ kiện</option>
            </select>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 liquid-glass-ui dark:liquid-glass-ui-dark border border-black/10 dark:border-white/10 rounded-xl shadow-ios transition-all hover:scale-[1.02] focus:outline-none focus:ring-1 focus:ring-primary/30 text-sm text-zinc-900 dark:text-zinc-100"
            >
              <option value="7days">7 ngày qua</option>
              <option value="15days">15 ngày qua</option>
              <option value="30days">30 ngày qua</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-b-[24px]">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Tên hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Danh mục</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Ngày hết hạn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Mức tồn kho</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {items.slice(0, 5).map((item, index) => {
                const status = getStockStatus(item.quantity);
                const isLastRow = index === Math.min(items.length, 5) - 1;
                return (
                  <tr key={item.id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${isLastRow ? '' : ''}`}>
                    <td className={`px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100 ${isLastRow ? 'rounded-bl-[24px]' : ''}`}>{item.name}</td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{item.category}</td>
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">28 Feb 2025</td>
                    <td className="px-6 py-4">
                      <div className="w-32">
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                          <div 
                            className={`bg-${status.color} rounded-full h-2`}
                            style={{ width: `${status.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${isLastRow ? 'rounded-br-[24px]' : ''}`}>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full bg-${status.color}/10 text-${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
