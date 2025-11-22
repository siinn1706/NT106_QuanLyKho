/** Items_Alerts_Page.tsx - Cảnh báo tồn kho */

import { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaBox, FaCalendar, FaChartLine, FaArrowDown, FaArrowUp, FaBell } from 'react-icons/fa';

interface AlertItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock: number; // Ngưỡng tồn kho tối đa
  category: string;
  lastUpdate: string;
  status: 'critical' | 'warning' | 'low' | 'overstock';
}

export default function Items_Alerts_Page() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'low' | 'overstock'>('all');

  useEffect(() => {
    // Call API để lấy danh sách cảnh báo
    const fetchAlerts = async () => {
      try {
        const response = await fetch('http://localhost:8000/items/alerts');
        if (!response.ok) throw new Error('Failed to fetch alerts');
        const data = await response.json();
        setAlerts(data);
        /* Expected JSON structure from BE:
        [
          {
            "id": "ITEM001",
            "name": "Laptop Dell XPS 15",
            "sku": "SKU001",
            "currentStock": 3,
            "minStock": 10,
            "maxStock": 100,
            "category": "Điện tử",
            "lastUpdate": "2024-01-15T10:30:00",
            "status": "critical"
          },
          {
            "id": "ITEM002",
            "name": "iPhone 15 Pro Max",
            "sku": "SKU002",
            "currentStock": 150,
            "minStock": 20,
            "maxStock": 120,
            "category": "Điện thoại",
            "lastUpdate": "2024-01-15T11:00:00",
            "status": "overstock"
          }
        ]
        Note: status can be "critical" | "warning" | "low" | "overstock"
        */
      } catch (error) {
        console.error('Error fetching alerts:', error);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const getStatusBadge = (status: AlertItem['status']) => {
    switch (status) {
      case 'critical':
        return 'bg-danger/10 text-danger border-danger/30';
      case 'warning':
        return 'bg-warning/10 text-warning border-warning/30';
      case 'low':
        return 'bg-info/10 text-info border-info/30';
      case 'overstock':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    }
  };

  const getStatusText = (status: AlertItem['status']) => {
    switch (status) {
      case 'critical':
        return 'Cực kỳ thấp';
      case 'warning':
        return 'Thấp';
      case 'low':
        return 'Cần nhập thêm';
      case 'overstock':
        return 'Tồn kho quá nhiều';
    }
  };

  const getStockPercentage = (current: number, min: number, max: number, status: AlertItem['status']) => {
    if (status === 'overstock') {
      return Math.min((current / max) * 100, 100);
    }
    return (current / min) * 100;
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.status === filter);

  const criticalCount = alerts.filter(a => a.status === 'critical').length;
  const warningCount = alerts.filter(a => a.status === 'warning').length;
  const lowCount = alerts.filter(a => a.status === 'low').length;
  const overstockCount = alerts.filter(a => a.status === 'overstock').length;

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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Tổng cảnh báo */}
        <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
              <FaBell className="text-danger text-xl" />
            </div>
            <span className="text-3xl font-bold text-danger">{alerts.length}</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Tổng cảnh báo</p>
        </div>

        {/* Cực kỳ thấp */}
        <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <FaArrowDown className="text-red-500 text-xl" />
            </div>
            <span className="text-3xl font-bold text-red-500">{criticalCount}</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Cực kỳ thấp</p>
        </div>

        {/* Thấp */}
        <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
              <FaArrowDown className="text-warning text-xl" />
            </div>
            <span className="text-3xl font-bold text-warning">{warningCount}</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Thấp</p>
        </div>

        {/* Cần nhập thêm */}
        <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-full bg-info/20 flex items-center justify-center">
              <FaBox className="text-info text-xl" />
            </div>
            <span className="text-3xl font-bold text-info">{lowCount}</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Cần nhập thêm</p>
        </div>

        {/* Tồn kho quá nhiều */}
        <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <FaArrowUp className="text-purple-400 text-xl" />
            </div>
            <span className="text-3xl font-bold text-purple-400">{overstockCount}</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Tồn kho quá nhiều</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-4 py-2.5 rounded-[16px] font-medium transition-all ${
              filter === 'all'
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Tất cả ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`flex-1 px-4 py-2.5 rounded-[16px] font-medium transition-all ${
              filter === 'critical'
                ? 'bg-danger/10 text-danger border border-danger/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Cực kỳ thấp ({criticalCount})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`flex-1 px-4 py-2.5 rounded-[16px] font-medium transition-all ${
              filter === 'warning'
                ? 'bg-warning/10 text-warning border border-warning/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Thấp ({warningCount})
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`flex-1 px-4 py-2.5 rounded-[16px] font-medium transition-all ${
              filter === 'low'
                ? 'bg-info/10 text-info border border-info/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Cần nhập ({lowCount})
          </button>
          <button
            onClick={() => setFilter('overstock')}
            className={`flex-1 px-4 py-2.5 rounded-[16px] font-medium transition-all ${
              filter === 'overstock'
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Tồn quá nhiều ({overstockCount})
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios p-12 text-center">
            <FaBox className="text-5xl text-zinc-400 dark:text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400">Không có cảnh báo nào</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const percentage = getStockPercentage(alert.currentStock, alert.minStock, alert.maxStock, alert.status);
            
            return (
              <div
                key={alert.id}
                className="liquid-glass dark:liquid-glass-dark rounded-[24px] border border-black/10 dark:border-white/10 shadow-ios p-6 hover:scale-[1.01] transition-transform"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        {alert.name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(alert.status)}`}>
                        {getStatusText(alert.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                      <span>SKU: {alert.sku}</span>
                      <span>•</span>
                      <span>{alert.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <FaCalendar size={12} />
                        {new Date(alert.lastUpdate).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  {alert.status === 'overstock' ? (
                    <button className="px-4 py-2 rounded-[16px] bg-purple-500 text-white font-medium hover:scale-105 transition-transform shadow-ios hover:bg-purple-600">
                      Xuất kho
                    </button>
                  ) : (
                    <button className="px-4 py-2 rounded-[16px] bg-success text-white font-medium hover:scale-105 transition-transform shadow-ios hover:bg-success/90">
                      Nhập kho ngay
                    </button>
                  )}
                </div>

                {/* Stock Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                      <FaChartLine size={14} />
                      Tồn kho hiện tại
                    </span>
                    {alert.status === 'overstock' ? (
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {alert.currentStock} / {alert.maxStock} (tối đa)
                      </span>
                    ) : (
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {alert.currentStock} / {alert.minStock} (tối thiểu)
                      </span>
                    )}
                  </div>
                  <div className="relative w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                        alert.status === 'critical' ? 'bg-danger' :
                        alert.status === 'warning' ? 'bg-warning' :
                        alert.status === 'overstock' ? 'bg-purple-500' :
                        'bg-info'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  {alert.status === 'overstock' ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Vượt quá <strong>{alert.currentStock - alert.maxStock}</strong> sản phẩm so với ngưỡng tối đa
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Cần nhập thêm tối thiểu <strong>{alert.minStock - alert.currentStock}</strong> sản phẩm
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
