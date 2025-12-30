import { useState } from 'react';
import Button from '../../components/ui/Button';
import CustomSelect from '../../components/ui/CustomSelect';
import { useThemeStore } from '../../theme/themeStore';
import Icon from '../../components/ui/Icon';

const options = [
  { value: 'option1', label: 'Tùy chọn 1' },
  { value: 'option2', label: 'Tùy chọn 2' },
  { value: 'option3', label: 'Tùy chọn 3', disabled: true },
  { value: 'option4', label: 'Tùy chọn 4' },
  { value: 'option5', label: 'Tùy chọn 5' },
];

const iconOptions = [
  { value: 'home', label: 'Trang chủ', icon: <Icon name="home" size="sm" /> },
  { value: 'settings', label: 'Cài đặt', icon: <Icon name="cog" size="sm" /> },
  { value: 'user', label: 'Người dùng', icon: <Icon name="user" size="sm" /> },
  { value: 'chart', label: 'Báo cáo', icon: <Icon name="chart-line" size="sm" /> },
];

export default function ComponentDemo() {
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-1)]">Liquid Glass Components</h1>
          <Button variant="secondary" onClick={toggleDarkMode} size="sm">
            <Icon name={isDarkMode ? 'sun' : 'moon'} size="sm" />
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </Button>
        </div>

        <div className="liquid-glass-card rounded-[var(--radius-2xl)] p-8 mb-8">
          <h2 className="text-lg font-semibold text-[var(--text-1)] mb-6">Button Variants</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-[var(--text-2)] mb-3">Primary</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
                <Button variant="primary" size="md" leftIcon={<Icon name="plus" size="sm" />}>With Icon</Button>
                <Button variant="primary" size="md" disabled>Disabled</Button>
                <Button variant="primary" size="md" isLoading onClick={handleLoadingDemo}>Loading</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-[var(--text-2)] mb-3">Secondary</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" size="sm">Small</Button>
                <Button variant="secondary" size="md">Medium</Button>
                <Button variant="secondary" size="lg">Large</Button>
                <Button variant="secondary" size="md" leftIcon={<Icon name="edit" size="sm" />}>With Icon</Button>
                <Button variant="secondary" size="md" disabled>Disabled</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-[var(--text-2)] mb-3">Ghost</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="ghost" size="sm">Small</Button>
                <Button variant="ghost" size="md">Medium</Button>
                <Button variant="ghost" size="lg">Large</Button>
                <Button variant="ghost" size="md" leftIcon={<Icon name="search" size="sm" />}>With Icon</Button>
                <Button variant="ghost" size="md" disabled>Disabled</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-[var(--text-2)] mb-3">Destructive</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="destructive" size="sm">Small</Button>
                <Button variant="destructive" size="md">Medium</Button>
                <Button variant="destructive" size="lg">Large</Button>
                <Button variant="destructive" size="md" leftIcon={<Icon name="trash" size="sm" />}>Delete</Button>
                <Button variant="destructive" size="md" disabled>Disabled</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-[var(--text-2)] mb-3">Interactive Demo</h3>
              <div className="flex gap-3">
                <Button 
                  variant="primary" 
                  size="md" 
                  isLoading={loading}
                  onClick={handleLoadingDemo}
                >
                  {loading ? 'Processing...' : 'Click to Load'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="liquid-glass-card rounded-[var(--radius-2xl)] p-8 mb-8">
          <h2 className="text-lg font-semibold text-[var(--text-1)] mb-6">Select / Dropdown</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-[var(--text-2)] mb-3">Basic Select</h3>
              <div className="flex flex-wrap gap-4">
                <div className="w-64">
                  <CustomSelect
                    options={options}
                    value={selectedValue}
                    onChange={setSelectedValue}
                    placeholder="Chọn một tùy chọn..."
                    size="sm"
                  />
                </div>
                <div className="w-64">
                  <CustomSelect
                    options={options}
                    value={selectedValue}
                    onChange={setSelectedValue}
                    placeholder="Chọn một tùy chọn..."
                    size="md"
                  />
                </div>
                <div className="w-64">
                  <CustomSelect
                    options={options}
                    value={selectedValue}
                    onChange={setSelectedValue}
                    placeholder="Chọn một tùy chọn..."
                    size="lg"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-[var(--text-2)] mb-3">With Icons</h3>
              <div className="w-64">
                <CustomSelect
                  options={iconOptions}
                  value={selectedIcon}
                  onChange={setSelectedIcon}
                  placeholder="Chọn menu..."
                  size="md"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-[var(--text-2)] mb-3">Disabled</h3>
              <div className="w-64">
                <CustomSelect
                  options={options}
                  value="option1"
                  onChange={() => {}}
                  disabled
                  size="md"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-[var(--text-2)] mb-3">Current Selection</h3>
              <p className="text-[var(--text-1)]">
                Basic: <strong>{selectedValue || 'None'}</strong>
                {' | '}
                Icon: <strong>{selectedIcon || 'None'}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="liquid-glass-card rounded-[var(--radius-2xl)] p-8">
          <h2 className="text-lg font-semibold text-[var(--text-1)] mb-6">Glass Input</h2>
          
          <div className="space-y-4 max-w-md">
            <input
              type="text"
              placeholder="Text input..."
              className="w-full px-4 py-3 liquid-glass-input rounded-[var(--radius-xl)] text-[var(--text-1)] placeholder-[var(--text-3)]"
            />
            <input
              type="email"
              placeholder="Email input..."
              className="w-full px-4 py-3 liquid-glass-input rounded-[var(--radius-xl)] text-[var(--text-1)] placeholder-[var(--text-3)]"
            />
            <textarea
              placeholder="Textarea..."
              rows={3}
              className="w-full px-4 py-3 liquid-glass-input rounded-[var(--radius-xl)] text-[var(--text-1)] placeholder-[var(--text-3)] resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

