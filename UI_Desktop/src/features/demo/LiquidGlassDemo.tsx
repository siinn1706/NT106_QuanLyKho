import { useState } from 'react';
import Button from '../../components/ui/Button';
import CustomSelect from '../../components/ui/CustomSelect';
import { useThemeStore } from '../../theme/themeStore';
import Icon from '../../components/ui/Icon';

const selectOptions = [
  { value: 'option1', label: 'Kho miền Bắc' },
  { value: 'option2', label: 'Kho miền Trung' },
  { value: 'option3', label: 'Kho miền Nam' },
  { value: 'option4', label: 'Kho tổng hợp' },
];

const statusOptions = [
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'inactive', label: 'Tạm ngưng' },
];

export default function LiquidGlassDemo() {
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>('active');
  const [loading, setLoading] = useState(false);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient Background - tương tự như hình mẫu */}
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-100 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
        {/* Animated blob shapes */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-cyan-300/30 to-blue-400/30 dark:from-cyan-600/20 dark:to-blue-700/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/30 to-pink-400/30 dark:from-purple-700/20 dark:to-pink-800/20 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-blue-300/20 to-cyan-400/20 dark:from-blue-600/15 dark:to-cyan-700/15 rounded-full blur-3xl animate-pulse [animation-delay:4s]" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header with theme toggle */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-3xl font-semibold text-[var(--text-1)] mb-2">
                Liquid Glass UI Components
              </h1>
              <p className="text-[var(--text-2)]">
                Frosted glass effect inspired by Apple design
              </p>
            </div>
            <Button 
              variant="secondary" 
              onClick={toggleDarkMode} 
              size="md"
              leftIcon={<Icon name={isDarkMode ? 'sun' : 'moon'} size="sm" />}
            >
              {isDarkMode ? 'Light' : 'Dark'}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Button Showcase */}
            <div className="liquid-glass-dropdown p-8">
              <h2 className="text-lg font-semibold text-[var(--text-1)] mb-6">
                Button Variants
              </h2>
              
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-[var(--text-2)] mb-3">Primary Actions</p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary" size="sm">
                      Small
                    </Button>
                    <Button variant="primary" size="md">
                      Medium
                    </Button>
                    <Button variant="primary" size="lg">
                      Large
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-[var(--text-2)] mb-3">Secondary Actions</p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="secondary" size="sm">
                      Cancel
                    </Button>
                    <Button variant="secondary" size="md">
                      Cancel
                    </Button>
                    <Button variant="secondary" size="lg">
                      Cancel
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-[var(--text-2)] mb-3">With Icons</p>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="primary" 
                      size="md"
                      leftIcon={<Icon name="plus" size="sm" />}
                    >
                      Thêm mới
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="md"
                      leftIcon={<Icon name="download" size="sm" />}
                    >
                      Tải xuống
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-[var(--text-2)] mb-3">States</p>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="primary" 
                      size="md"
                      isLoading={loading}
                      onClick={handleLoadingDemo}
                    >
                      {loading ? 'Processing...' : 'Click me'}
                    </Button>
                    <Button variant="secondary" size="md" disabled>
                      Disabled
                    </Button>
                    <Button variant="destructive" size="md">
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Dropdown Showcase */}
            <div className="liquid-glass-dropdown p-8">
              <h2 className="text-lg font-semibold text-[var(--text-1)] mb-6">
                Dropdown Selects
              </h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-2)] mb-2">
                    Chọn kho hàng
                  </label>
                  <CustomSelect
                    options={selectOptions}
                    value={selectedWarehouse}
                    onChange={setSelectedWarehouse}
                    placeholder="Chọn kho..."
                    size="md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-2)] mb-2">
                    Trạng thái
                  </label>
                  <CustomSelect
                    options={statusOptions}
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    size="md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-2)] mb-2">
                    Size Small
                  </label>
                  <CustomSelect
                    options={selectOptions}
                    value={selectedWarehouse}
                    onChange={setSelectedWarehouse}
                    placeholder="Compact select..."
                    size="sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-2)] mb-2">
                    Size Large
                  </label>
                  <CustomSelect
                    options={selectOptions}
                    value={selectedWarehouse}
                    onChange={setSelectedWarehouse}
                    placeholder="Large select..."
                    size="lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Glass Card Example */}
          <div className="liquid-glass-dropdown p-8">
            <h2 className="text-lg font-semibold text-[var(--text-1)] mb-6">
              Liquid Glass Container
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="liquid-glass-btn w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Icon name="box" size="lg" className="text-[var(--primary)]" />
                </div>
                <h3 className="font-medium text-[var(--text-1)] mb-1">Command</h3>
                <p className="text-sm text-[var(--text-2)]">Quick actions</p>
              </div>
              <div className="text-center">
                <div className="liquid-glass-btn w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Icon name="inbox" size="lg" className="text-[var(--primary)]" />
                </div>
                <h3 className="font-medium text-[var(--text-1)] mb-1">Inbox</h3>
                <p className="text-sm text-[var(--text-2)]">Messages</p>
              </div>
              <div className="text-center">
                <div className="liquid-glass-btn w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Icon name="chart-line" size="lg" className="text-[var(--primary)]" />
                </div>
                <h3 className="font-medium text-[var(--text-1)] mb-1">Analytics</h3>
                <p className="text-sm text-[var(--text-2)]">Reports</p>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="mt-6 liquid-glass-dropdown p-6">
            <p className="text-sm text-[var(--text-2)] leading-relaxed">
              <strong className="text-[var(--text-1)]">✨ Liquid Glass Effect:</strong>
              {' '}Hiệu ứng kính mờ này sử dụng <code className="px-1.5 py-0.5 rounded bg-[var(--glass-item-hover)] text-[var(--text-1)]">backdrop-filter: blur()</code> 
              {' '}kết hợp với radial gradient tỏa đều và rim highlight tinh tế. 
              Không sử dụng box-shadow nặng, thay vào đó dùng border và layering để tạo chiều sâu theo Apple design principles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
