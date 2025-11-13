import { ReactNode, useState } from 'react';
import { useUIStore } from '../state/ui_store';
import ChatWidget from './chat/ChatWidget';
import SettingsModal from './SettingsModal';
import { FaHome, FaBox, FaExchangeAlt, FaBuilding, FaChartLine, FaUser, FaSearch, FaSun, FaMoon, FaBars, FaChevronLeft, FaCog } from 'react-icons/fa';

interface LayoutProps {
  children: ReactNode;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

export default function Layout({ children }: LayoutProps) {
  const { isDarkMode, toggleDarkMode, isSidebarCollapsed, toggleSidebar } = useUIStore();
  const [activePath, setActivePath] = useState('/dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const menuItems: MenuItem[] = [
    { id: 'home', label: 'Trang chủ', icon: 'FaHome', path: '/dashboard' },
    { id: 'items', label: 'Hàng hoá', icon: 'FaBox', path: '/items' },
    { id: 'stock', label: 'Nhập/Xuất kho', icon: 'FaExchangeAlt', path: '/stock', badge: 14 },
    { id: 'suppliers', label: 'Nhà cung cấp', icon: 'FaBuilding', path: '/suppliers' },
    { id: 'reports', label: 'Báo cáo', icon: 'FaChartLine', path: '/reports' },
  ];

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Sidebar trái */}
      <aside
        className={`${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        } bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 flex flex-col`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                N3T
              </div>
              <span className="font-semibold text-lg">Quản lý Kho</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title={isSidebarCollapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            {isSidebarCollapsed ? <FaBars size={18} /> : <FaChevronLeft size={18} />}
          </button>
        </div>
        {/* Menu items */}
        <nav className="flex-1 p-2 overflow-y-auto scrollbar-thin">
          {menuItems.map((item) => {
            const IconComponent = item.icon === 'FaHome' ? FaHome : 
                                 item.icon === 'FaBox' ? FaBox :
                                 item.icon === 'FaExchangeAlt' ? FaExchangeAlt :
                                 item.icon === 'FaBuilding' ? FaBuilding :
                                 FaChartLine;
            return (
              <button
                key={item.id}
                onClick={() => setActivePath(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                  activePath === item.path
                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <IconComponent size={20} />
                {!isSidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 bg-danger text-white text-xs rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>
        {!isSidebarCollapsed && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-300 dark:bg-zinc-700 rounded-full flex items-center justify-center">
                <FaUser size={18} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Admin User</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">admin@n3t.com</p>
              </div>
            </div>
          </div>
        )}
      </aside>
      {/* Nội dung chính */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Theo dõi hiệu suất, hàng hoá và tồn kho
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm hàng hoá, báo cáo..."
                className="w-80 pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"><FaSearch size={16} /></span>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title={isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}
            >
              {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title="Cài đặt"
            >
              <FaCog size={20} />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {children}
        </main>
      </div>
      {/* ChatWidget luôn xuất hiện ở mọi trang */}
      <ChatWidget />
      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
