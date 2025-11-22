/** Reports_Page.tsx - Báo cáo tổng hợp */

import { useState, useEffect } from "react";
import { FaChartBar, FaChartLine, FaChartPie, FaFileExport } from "react-icons/fa";
import { useUIStore } from "../../state/ui_store";

export default function Reports_Page() {
  const [selectedReport, setSelectedReport] = useState<string>("inventory");
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  const [inventoryData, setInventoryData] = useState<Array<{category: string, value: number, color: string}>>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<Array<{month: string, import: number, export: number}>>([]);
  const [lowStockItems, setLowStockItems] = useState<Array<{name: string, stock: number, min: number, status: string}>>([]);
  const [damageStats, setDamageStats] = useState({damaged: 0, discarded: 0, processing: 0, rate: 0});

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        const [inventoryRes, trendRes, lowStockRes] = await Promise.all([
          fetch('http://localhost:8000/reports/inventory-by-category').catch(() => null),
          fetch('http://localhost:8000/reports/monthly-trend').catch(() => null),
          fetch('http://localhost:8000/reports/low-stock-items').catch(() => null),
        ]);

        if (inventoryRes?.ok) {
          const data = await inventoryRes.json();
          setInventoryData(data || []);
        }
        /* Expected JSON structure from BE (GET /reports/inventory-by-category):
        [
          {
            "category": "Điện tử",
            "value": 450,
            "color": "#00BCD4"
          },
          {
            "category": "Thực phẩm",
            "value": 320,
            "color": "#4CAF50"
          }
        ]
        */

        if (trendRes?.ok) {
          const data = await trendRes.json();
          setMonthlyTrend(data || []);
        }
        /* Expected JSON structure from BE (GET /reports/monthly-trend):
        [
          {
            "month": "T1",
            "import": 120,
            "export": 80
          },
          {
            "month": "T2",
            "import": 150,
            "export": 100
          }
        ]
        */

        if (lowStockRes?.ok) {
          const data = await lowStockRes.json();
          setLowStockItems(data || []);
        }
        /* Expected JSON structure from BE (GET /reports/low-stock-items):
        [
          {
            "name": "Laptop Dell XPS",
            "stock": 5,
            "min": 10,
            "status": "danger"
          },
          {
            "name": "iPhone 15 Pro",
            "stock": 8,
            "min": 15,
            "status": "warning"
          }
        ]
        Note: status can be "danger" | "warning"
        */
      } catch (error) {
        console.error('Error fetching reports data:', error);
      }
    };

    fetchReportsData();
  }, []);

  const maxValue = inventoryData.length > 0 ? Math.max(...inventoryData.map(d => d.value)) : 1;
  const maxMonthly = monthlyTrend.length > 0 ? Math.max(...monthlyTrend.flatMap(d => [d.import, d.export])) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Báo cáo & Thống kê</h1>
        <button className="flex items-center gap-2 bg-info text-white px-6 py-3 rounded-[20px] font-medium transition-transform hover:scale-105 shadow-ios hover:bg-info/90 backdrop-blur-sm">
          <FaFileExport />
          Xuất báo cáo
        </button>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => setSelectedReport("inventory")}
          className={`p-6 rounded-[24px] border-2 transition-all hover:scale-[1.02] liquid-glass dark:liquid-glass-dark shadow-ios ${
            selectedReport === "inventory"
              ? "border-primary bg-primary/10"
              : "border-black/10 dark:border-white/10"
          }`}
        >
          <FaChartPie className={`text-2xl mb-2 ${selectedReport === "inventory" ? "text-primary" : ""}`} />
          <div className="font-semibold">Tồn kho</div>
          <div className="text-sm text-zinc-500">Theo danh mục</div>
        </button>

        <button
          onClick={() => setSelectedReport("trend")}
          className={`p-6 rounded-[24px] border-2 transition-all hover:scale-[1.02] liquid-glass dark:liquid-glass-dark shadow-ios ${
            selectedReport === "trend"
              ? "border-success bg-success/10"
              : "border-black/10 dark:border-white/10"
          }`}
        >
          <FaChartLine className={`text-2xl mb-2 ${selectedReport === "trend" ? "text-success" : ""}`} />
          <div className="font-semibold">Xu hướng</div>
          <div className="text-sm text-zinc-500">Nhập/Xuất kho</div>
        </button>

        <button
          onClick={() => setSelectedReport("lowstock")}
          className={`p-6 rounded-[24px] border-2 transition-all hover:scale-[1.02] liquid-glass dark:liquid-glass-dark shadow-ios ${
            selectedReport === "lowstock"
              ? "border-warning bg-warning/10"
              : "border-black/10 dark:border-white/10"
          }`}
        >
          <FaChartBar className={`text-2xl mb-2 ${selectedReport === "lowstock" ? "text-warning" : ""}`} />
          <div className="font-semibold">Cảnh báo</div>
          <div className="text-sm text-zinc-500">Hàng sắp hết</div>
        </button>

        <button
          onClick={() => setSelectedReport("damage")}
          className={`p-6 rounded-[24px] border-2 transition-all hover:scale-[1.02] liquid-glass dark:liquid-glass-dark shadow-ios ${
            selectedReport === "damage"
              ? "border-danger bg-danger/10"
              : "border-black/10 dark:border-white/10"
          }`}
        >
          <FaChartBar className={`text-2xl mb-2 ${selectedReport === "damage" ? "text-danger" : ""}`} />
          <div className="font-semibold">Hư hỏng</div>
          <div className="text-sm text-zinc-500">Hàng lỗi/hủy</div>
        </button>
      </div>

      {/* Report Content */}
      <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios p-6">
        {/* Inventory Report */}
        {selectedReport === "inventory" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaChartPie className="text-primary" />
              Báo cáo tồn kho theo danh mục
            </h2>
            
            {/* Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="font-semibold text-sm text-zinc-500">Phân bố hàng tồn kho</div>
                {inventoryData.map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.category}</span>
                      <span className="font-bold">{item.value} sản phẩm</span>
                    </div>
                    <div className={`h-8 rounded-full overflow-hidden ${
                      isDarkMode ? "bg-zinc-800" : "bg-zinc-100"
                    }`}>
                      <div
                        className="h-full flex items-center justify-end pr-3 text-white text-xs font-bold transition-all duration-500"
                        style={{
                          width: `${(item.value / maxValue) * 100}%`,
                          backgroundColor: item.color,
                        }}
                      >
                        {inventoryData.length > 0 ? Math.round((item.value / inventoryData.reduce((a, b) => a + b.value, 0)) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="space-y-4">
                <div className="font-semibold text-sm text-zinc-500">Tổng quan</div>
                <div className={`p-4 liquid-glass-ui dark:liquid-glass-ui-dark border border-black/10 dark:border-white/10 rounded-xl shadow-ios transition-all hover:scale-[1.02]`}>
                  <div className="text-3xl font-bold text-primary">
                    {inventoryData.length > 0 ? inventoryData.reduce((acc, item) => acc + item.value, 0) : 0}
                  </div>
                  <div className="text-sm text-zinc-500">Tổng hàng hoá</div>
                </div>
                <div className={`p-4 liquid-glass-ui dark:liquid-glass-ui-dark border border-black/10 dark:border-white/10 rounded-xl shadow-ios transition-all hover:scale-[1.02]`}>
                  <div className="text-3xl font-bold text-success">
                    {inventoryData.length}
                  </div>
                  <div className="text-sm text-zinc-500">Danh mục sản phẩm</div>
                </div>
                <div className={`p-4 liquid-glass-ui dark:liquid-glass-ui-dark border border-black/10 dark:border-white/10 rounded-xl shadow-ios transition-all hover:scale-[1.02]`}>
                  <div className="text-3xl font-bold text-warning">
                    {inventoryData.length > 0 ? Math.max(...inventoryData.map(d => d.value)) : 0}
                  </div>
                  <div className="text-sm text-zinc-500">Danh mục lớn nhất</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Trend Report */}
        {selectedReport === "trend" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaChartLine className="text-success" />
              Xu hướng nhập/xuất kho 6 tháng
            </h2>

            <div className="space-y-8">
              {/* Bar Chart */}
              <div className="space-y-4">
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-primary"></div>
                    <span>Nhập kho</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-success"></div>
                    <span>Xuất kho</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-6 gap-4 items-end h-80">
                  {monthlyTrend.map((data) => (
                    <div key={data.month} className="space-y-2 flex flex-col items-center h-full justify-end">
                      <div className="flex gap-2 w-full justify-center items-end flex-1">
                        <div className="relative group flex-1">
                          <div
                            className="bg-primary rounded-t transition-all duration-500 hover:opacity-80"
                            style={{ height: `${(data.import / maxMonthly) * 100}%` }}
                          />
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition text-xs font-bold whitespace-nowrap">
                            {data.import}
                          </div>
                        </div>
                        <div className="relative group flex-1">
                          <div
                            className="bg-success rounded-t transition-all duration-500 hover:opacity-80"
                            style={{ height: `${(data.export / maxMonthly) * 100}%` }}
                          />
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition text-xs font-bold whitespace-nowrap">
                            {data.export}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium">{data.month}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className={`p-4 liquid-glass-ui dark:liquid-glass-ui-dark border border-black/10 dark:border-white/10 rounded-xl shadow-ios transition-all hover:scale-[1.02]`}>
                  <div className="text-2xl font-bold text-primary">
                    {monthlyTrend.length > 0 ? monthlyTrend.reduce((a, b) => a + b.import, 0) : 0}
                  </div>
                  <div className="text-sm text-zinc-500">Tổng nhập kho</div>
                </div>
                <div className={`p-4 liquid-glass-ui dark:liquid-glass-ui-dark border border-black/10 dark:border-white/10 rounded-xl shadow-ios transition-all hover:scale-[1.02]`}>
                  <div className="text-2xl font-bold text-success">
                    {monthlyTrend.length > 0 ? monthlyTrend.reduce((a, b) => a + b.export, 0) : 0}
                  </div>
                  <div className="text-sm text-zinc-500">Tổng xuất kho</div>
                </div>
                <div className={`p-4 liquid-glass-ui dark:liquid-glass-ui-dark border border-black/10 dark:border-white/10 rounded-xl shadow-ios transition-all hover:scale-[1.02]`}>
                  <div className="text-2xl font-bold text-info">
                    {monthlyTrend.length > 0 ? (monthlyTrend.reduce((a, b) => a + b.import, 0) - monthlyTrend.reduce((a, b) => a + b.export, 0)) : 0}
                  </div>
                  <div className="text-sm text-zinc-500">Chênh lệch</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Low Stock Report */}
        {selectedReport === "lowstock" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaChartBar className="text-warning" />
              Cảnh báo hàng sắp hết
            </h2>

            <div className="space-y-3">
              {lowStockItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border-l-4 ${
                    item.status === "danger"
                      ? "border-danger bg-danger/10"
                      : "border-warning bg-warning/10"
                  } ${isDarkMode ? "" : ""}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold">{item.name}</div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      item.status === "danger"
                        ? "bg-danger text-white"
                        : "bg-warning text-white"
                    }`}>
                      {item.status === "danger" ? "Khẩn cấp" : "Cảnh báo"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500">Tồn kho: </span>
                      <span className="font-bold">{item.stock}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Tối thiểu: </span>
                      <span className="font-bold">{item.min}</span>
                    </div>
                    <div className="flex-1">
                      <div className={`h-2 rounded-full overflow-hidden ${
                        isDarkMode ? "bg-zinc-800" : "bg-zinc-200"
                      }`}>
                        <div
                          className={`h-full transition-all duration-500 ${
                            item.status === "danger" ? "bg-danger" : "bg-warning"
                          }`}
                          style={{ width: `${(item.stock / item.min) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Damage Report */}
        {selectedReport === "damage" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaChartBar className="text-danger" />
              Báo cáo hàng hư hỏng
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-6 liquid-glass-ui dark:liquid-glass-ui-dark border border-black/10 dark:border-white/10 rounded-xl shadow-ios transition-all hover:scale-[1.02]`}>
                <div className="text-3xl font-bold text-danger">{damageStats.damaged}</div>
                <div className="text-sm text-zinc-500">Hàng hư hỏng</div>
              </div>
              <div className={`p-6 liquid-glass-ui dark:liquid-glass-ui-dark border border-black/10 dark:border-white/10 rounded-xl shadow-ios transition-all hover:scale-[1.02]`}>
                <div className="text-3xl font-bold text-warning">{damageStats.discarded}</div>
                <div className="text-sm text-zinc-500">Hàng hủy</div>
              </div>
              <div className={`p-6 liquid-glass-ui dark:liquid-glass-ui-dark border border-black/10 dark:border-white/10 rounded-xl shadow-ios transition-all hover:scale-[1.02]`}>
                <div className="text-3xl font-bold text-info">{damageStats.processing}</div>
                <div className="text-sm text-zinc-500">Đang xử lý</div>
              </div>
            </div>

            <div className={`p-4 liquid-glass-ui dark:liquid-glass-ui-dark border border-black/10 dark:border-white/10 rounded-xl shadow-ios transition-all hover:scale-[1.02]`}>
              <div className="text-sm text-zinc-500 mb-2">Tỷ lệ hư hỏng theo tháng</div>
              <div className="text-2xl font-bold">{damageStats.rate}%</div>
              <div className="text-xs text-zinc-500">Chưa có dữ liệu so sánh</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
