/** Reports_Page.tsx - Báo cáo tổng hợp */

import { useState } from "react";
import { FaChartBar, FaChartLine, FaChartPie, FaFileExport } from "react-icons/fa";
import { useUIStore } from "../../state/ui_store";

export default function Reports_Page() {
  const [selectedReport, setSelectedReport] = useState<string>("inventory");
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  // Mock data cho biểu đồ
  const inventoryData = [
    { category: "Điện tử", value: 450, color: "#00BCD4" },
    { category: "Thực phẩm", value: 320, color: "#4CAF50" },
    { category: "Gia dụng", value: 280, color: "#FFC107" },
    { category: "Văn phòng phẩm", value: 180, color: "#FF5722" },
    { category: "Dược phẩm", value: 220, color: "#9C27B0" },
  ];

  const monthlyTrend = [
    { month: "T1", import: 120, export: 80 },
    { month: "T2", import: 150, export: 100 },
    { month: "T3", import: 180, export: 140 },
    { month: "T4", import: 160, export: 120 },
    { month: "T5", import: 200, export: 170 },
    { month: "T6", import: 190, export: 160 },
  ];

  const lowStockItems = [
    { name: "Laptop Dell XPS", stock: 5, min: 10, status: "danger" },
    { name: "iPhone 15 Pro", stock: 8, min: 15, status: "warning" },
    { name: "Bàn phím cơ", stock: 12, min: 20, status: "warning" },
    { name: "Tai nghe Sony", stock: 3, min: 10, status: "danger" },
  ];

  const maxValue = Math.max(...inventoryData.map(d => d.value));
  const maxMonthly = Math.max(...monthlyTrend.flatMap(d => [d.import, d.export]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Báo cáo & Thống kê</h1>
        <button className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
          isDarkMode 
            ? "bg-primary/20 text-primary hover:bg-primary/30" 
            : "bg-primary text-white hover:bg-primary/90"
        }`}>
          <FaFileExport />
          Xuất báo cáo
        </button>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => setSelectedReport("inventory")}
          className={`p-4 rounded-lg border-2 transition ${
            selectedReport === "inventory"
              ? "border-primary bg-primary/10"
              : isDarkMode
              ? "border-zinc-800 hover:border-zinc-700"
              : "border-zinc-200 hover:border-zinc-300"
          }`}
        >
          <FaChartPie className={`text-2xl mb-2 ${selectedReport === "inventory" ? "text-primary" : ""}`} />
          <div className="font-semibold">Tồn kho</div>
          <div className="text-sm text-zinc-500">Theo danh mục</div>
        </button>

        <button
          onClick={() => setSelectedReport("trend")}
          className={`p-4 rounded-lg border-2 transition ${
            selectedReport === "trend"
              ? "border-success bg-success/10"
              : isDarkMode
              ? "border-zinc-800 hover:border-zinc-700"
              : "border-zinc-200 hover:border-zinc-300"
          }`}
        >
          <FaChartLine className={`text-2xl mb-2 ${selectedReport === "trend" ? "text-success" : ""}`} />
          <div className="font-semibold">Xu hướng</div>
          <div className="text-sm text-zinc-500">Nhập/Xuất kho</div>
        </button>

        <button
          onClick={() => setSelectedReport("lowstock")}
          className={`p-4 rounded-lg border-2 transition ${
            selectedReport === "lowstock"
              ? "border-warning bg-warning/10"
              : isDarkMode
              ? "border-zinc-800 hover:border-zinc-700"
              : "border-zinc-200 hover:border-zinc-300"
          }`}
        >
          <FaChartBar className={`text-2xl mb-2 ${selectedReport === "lowstock" ? "text-warning" : ""}`} />
          <div className="font-semibold">Cảnh báo</div>
          <div className="text-sm text-zinc-500">Hàng sắp hết</div>
        </button>

        <button
          onClick={() => setSelectedReport("damage")}
          className={`p-4 rounded-lg border-2 transition ${
            selectedReport === "damage"
              ? "border-danger bg-danger/10"
              : isDarkMode
              ? "border-zinc-800 hover:border-zinc-700"
              : "border-zinc-200 hover:border-zinc-300"
          }`}
        >
          <FaChartBar className={`text-2xl mb-2 ${selectedReport === "damage" ? "text-danger" : ""}`} />
          <div className="font-semibold">Hư hỏng</div>
          <div className="text-sm text-zinc-500">Hàng lỗi/hủy</div>
        </button>
      </div>

      {/* Report Content */}
      <div className={`rounded-xl border p-6 ${
        isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
      }`}>
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
                        {Math.round((item.value / inventoryData.reduce((a, b) => a + b.value, 0)) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="space-y-4">
                <div className="font-semibold text-sm text-zinc-500">Tổng quan</div>
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-zinc-800" : "bg-zinc-50"}`}>
                  <div className="text-3xl font-bold text-primary">
                    {inventoryData.reduce((a, b) => a + b.value, 0)}
                  </div>
                  <div className="text-sm text-zinc-500">Tổng số lượng hàng tồn</div>
                </div>
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-zinc-800" : "bg-zinc-50"}`}>
                  <div className="text-3xl font-bold text-success">
                    {inventoryData.length}
                  </div>
                  <div className="text-sm text-zinc-500">Danh mục sản phẩm</div>
                </div>
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-zinc-800" : "bg-zinc-50"}`}>
                  <div className="text-3xl font-bold text-warning">
                    {Math.max(...inventoryData.map(d => d.value))}
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
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-zinc-800" : "bg-zinc-50"}`}>
                  <div className="text-2xl font-bold text-primary">
                    {monthlyTrend.reduce((a, b) => a + b.import, 0)}
                  </div>
                  <div className="text-sm text-zinc-500">Tổng nhập kho</div>
                </div>
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-zinc-800" : "bg-zinc-50"}`}>
                  <div className="text-2xl font-bold text-success">
                    {monthlyTrend.reduce((a, b) => a + b.export, 0)}
                  </div>
                  <div className="text-sm text-zinc-500">Tổng xuất kho</div>
                </div>
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-zinc-800" : "bg-zinc-50"}`}>
                  <div className="text-2xl font-bold text-info">
                    {monthlyTrend.reduce((a, b) => a + b.import, 0) - monthlyTrend.reduce((a, b) => a + b.export, 0)}
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
                  className={`p-4 rounded-lg border-l-4 ${
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
              <div className={`p-6 rounded-lg ${isDarkMode ? "bg-zinc-800" : "bg-zinc-50"}`}>
                <div className="text-3xl font-bold text-danger">24</div>
                <div className="text-sm text-zinc-500">Hàng hư hỏng</div>
              </div>
              <div className={`p-6 rounded-lg ${isDarkMode ? "bg-zinc-800" : "bg-zinc-50"}`}>
                <div className="text-3xl font-bold text-warning">12</div>
                <div className="text-sm text-zinc-500">Hàng hủy</div>
              </div>
              <div className={`p-6 rounded-lg ${isDarkMode ? "bg-zinc-800" : "bg-zinc-50"}`}>
                <div className="text-3xl font-bold text-info">8</div>
                <div className="text-sm text-zinc-500">Đang xử lý</div>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${isDarkMode ? "bg-zinc-800" : "bg-zinc-50"}`}>
              <div className="text-sm text-zinc-500 mb-2">Tỷ lệ hư hỏng theo tháng</div>
              <div className="text-2xl font-bold">2.3%</div>
              <div className="text-xs text-success">↓ Giảm 0.5% so với tháng trước</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
