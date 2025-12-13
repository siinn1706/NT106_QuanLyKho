/** Items_Alerts_Page.tsx - Cảnh báo tồn kho */

import { useState, useEffect } from 'react';
import Icon from '../../components/ui/Icon';

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
          <div className="w-16 h-16 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-3)]">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards - KHÔNG shadow, border-based depth, KHÔNG transition-all */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Tổng cảnh báo */}
        <div className="bg-[var(--surface-1)] rounded-[var(--radius-2xl)] border border-[var(--border)] p-6 transition-colors duration-150 hover:border-[var(--border-hover)]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--danger-light)] flex items-center justify-center">
              <Icon name="bell" size="lg" className="text-[var(--danger)]" />
            </div>
            <span className="text-3xl font-bold text-[var(--danger)]">{alerts.length}</span>
          </div>
          <p className="text-sm text-[var(--text-2)] font-medium">Tổng cảnh báo</p>
        </div>

        {/* Cực kỳ thấp */}
        <div className="bg-[var(--surface-1)] rounded-[var(--radius-2xl)] border border-[var(--border)] p-6 transition-colors duration-150 hover:border-[var(--border-hover)]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-[var(--radius-md)] bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Icon name="arrow-down" size="lg" className="text-red-500" />
            </div>
            <span className="text-3xl font-bold text-red-500">{criticalCount}</span>
          </div>
          <p className="text-sm text-[var(--text-2)] font-medium">Cực kỳ thấp</p>
        </div>

        {/* Thấp */}
        <div className="bg-[var(--surface-1)] rounded-[var(--radius-2xl)] border border-[var(--border)] p-6 transition-colors duration-150 hover:border-[var(--border-hover)]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--warning-light)] flex items-center justify-center">
              <Icon name="arrow-down" size="lg" className="text-[var(--warning)]" />
            </div>
            <span className="text-3xl font-bold text-[var(--warning)]">{warningCount}</span>
          </div>
          <p className="text-sm text-[var(--text-2)] font-medium">Thấp</p>
        </div>

        {/* Cần nhập thêm */}
        <div className="bg-[var(--surface-1)] rounded-[var(--radius-2xl)] border border-[var(--border)] p-6 transition-colors duration-150 hover:border-[var(--border-hover)]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--info-light)] flex items-center justify-center">
              <Icon name="archive" size="lg" className="text-[var(--info)]" />
            </div>
            <span className="text-3xl font-bold text-[var(--info)]">{lowCount}</span>
          </div>
          <p className="text-sm text-[var(--text-2)] font-medium">Cần nhập thêm</p>
        </div>

        {/* Tồn kho quá nhiều */}
        <div className="bg-[var(--surface-1)] rounded-[var(--radius-2xl)] border border-[var(--border)] p-6 transition-colors duration-150 hover:border-[var(--border-hover)]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-[var(--radius-md)] bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Icon name="arrow-up" size="lg" className="text-purple-500" />
            </div>
            <span className="text-3xl font-bold text-purple-500">{overstockCount}</span>
          </div>
          <p className="text-sm text-[var(--text-2)] font-medium">Tồn kho quá nhiều</p>
        </div>
      </div>

      {/* Filter Tabs - KHÔNG shadow */}
      <div className="bg-[var(--surface-1)] rounded-[var(--radius-2xl)] border border-[var(--border)] p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-4 py-2.5 rounded-[var(--radius-lg)] font-medium transition-colors duration-150 ${
              filter === 'all'
                ? 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/30'
                : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] border border-transparent'
            }`}
          >
            Tất cả ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`flex-1 px-4 py-2.5 rounded-[var(--radius-lg)] font-medium transition-all duration-150 ${
              filter === 'critical'
                ? 'bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger)]/30'
                : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] border border-transparent'
            }`}
          >
            Cực kỳ thấp ({criticalCount})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`flex-1 px-4 py-2.5 rounded-[var(--radius-lg)] font-medium transition-all duration-150 ${
              filter === 'warning'
                ? 'bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning)]/30'
                : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] border border-transparent'
            }`}
          >
            Thấp ({warningCount})
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`flex-1 px-4 py-2.5 rounded-[var(--radius-lg)] font-medium transition-all duration-150 ${
              filter === 'low'
                ? 'bg-[var(--info-light)] text-[var(--info)] border border-[var(--info)]/30'
                : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] border border-transparent'
            }`}
          >
            Cần nhập ({lowCount})
          </button>
          <button
            onClick={() => setFilter('overstock')}
            className={`flex-1 px-4 py-2.5 rounded-[var(--radius-lg)] font-medium transition-all duration-150 ${
              filter === 'overstock'
                ? 'bg-[var(--overstock-light)] text-[var(--overstock)] border border-[var(--overstock)]/30'
                : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] border border-transparent'
            }`}
          >
            Tồn quá nhiều ({overstockCount})
          </button>
        </div>
      </div>

      {/* Alerts List - KHÔNG shadow */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-[var(--surface-1)] rounded-[var(--radius-2xl)] border border-[var(--border)] p-12 text-center">
            <span className="w-16 h-16 flex items-center justify-center mx-auto mb-4 rounded-full bg-[var(--surface-2)]">
              <Icon name="archive" size="xl" className="opacity-40" />
            </span>
            <p className="text-[var(--text-3)]">Không có cảnh báo nào</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const percentage = getStockPercentage(alert.currentStock, alert.minStock, alert.maxStock, alert.status);
            
            return (
              <div
                key={alert.id}
                className="bg-[var(--surface-1)] rounded-[var(--radius-2xl)] border border-[var(--border)] p-6 transition-colors duration-150 hover:border-[var(--border-hover)]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-[var(--text-1)]">
                        {alert.name}
                      </h3>
                      <span className={`px-3 py-1 rounded-[var(--radius-sm)] text-xs font-medium border ${getStatusBadge(alert.status)}`}>
                        {getStatusText(alert.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[var(--text-3)]">
                      <span>SKU: {alert.sku}</span>
                      <span>•</span>
                      <span>{alert.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Icon name="calendar" size="sm" />
                        {new Date(alert.lastUpdate).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  {alert.status === 'overstock' ? (
                    <button className="px-4 py-2 rounded-[var(--radius-lg)] bg-purple-500 text-white font-medium transition-all duration-150 hover:bg-purple-600 border border-purple-500">
                      Xuất kho
                    </button>
                  ) : (
                    <button className="px-4 py-2 rounded-[var(--radius-lg)] bg-[var(--success)] text-white font-medium transition-all duration-150 hover:opacity-90 border border-[var(--success)]">
                      Nhập kho ngay
                    </button>
                  )}
                </div>

                {/* Stock Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-2)] flex items-center gap-2">
                      <Icon name="chart" size="sm" />
                      Tồn kho hiện tại
                    </span>
                    {alert.status === 'overstock' ? (
                      <span className="font-bold text-[var(--text-1)]">
                        {alert.currentStock} / {alert.maxStock} (tối đa)
                      </span>
                    ) : (
                      <span className="font-bold text-[var(--text-1)]">
                        {alert.currentStock} / {alert.minStock} (tối thiểu)
                      </span>
                    )}
                  </div>
                  <div className="relative w-full h-3 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${
                        alert.status === 'critical' ? 'bg-[var(--danger)]' :
                        alert.status === 'warning' ? 'bg-[var(--warning)]' :
                        alert.status === 'overstock' ? 'bg-purple-500' :
                        'bg-[var(--info)]'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  {alert.status === 'overstock' ? (
                    <p className="text-xs text-[var(--text-3)]">
                      Vượt quá <strong>{alert.currentStock - alert.maxStock}</strong> sản phẩm so với ngưỡng tối đa
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--text-3)]">
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
