import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '../state/ui_store';
import { useAuthStore } from '../state/auth_store';
import ChatWidget from './chat/ChatWidget';
import SettingsModal from './SettingsModal';
import { apiLogout } from '../app/api_client';
import { FaHome, FaBox, FaExchangeAlt, FaBuilding, FaChartLine, FaUser, FaSearch, FaSun, FaMoon, FaBars, FaChevronLeft, FaCog, FaSignOutAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface LayoutProps {
  children: ReactNode;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
  subItems?: { id: string; label: string; path: string; }[];
}

export default function Layout({ children }: LayoutProps) {
  const { isDarkMode, toggleDarkMode, isSidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['items']);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const menuItems: MenuItem[] = [
    { id: 'home', label: 'Trang chủ', icon: 'FaHome', path: '/dashboard' },
    { 
      id: 'items', 
      label: 'Hàng hoá', 
      icon: 'FaBox', 
      path: '/items',
      subItems: [
        { id: 'item-list', label: 'Danh sách hàng', path: '/items' },
        { id: 'item-tracking', label: 'Theo dõi hàng', path: '/items/tracking' },
        { id: 'item-alerts', label: 'Cảnh báo tồn kho', path: '/items/alerts' }
      ]
    },
    { 
      id: 'stock', 
      label: 'Nhập/Xuất kho', 
      icon: 'FaExchangeAlt', 
      path: '/stock', 
      badge: 14,
      subItems: [
        { id: 'stock-in', label: 'Nhập kho', path: '/stock/in' },
        { id: 'stock-out', label: 'Xuất kho', path: '/stock/out' }
      ]
    },
    { id: 'suppliers', label: 'Nhà cung cấp', icon: 'FaBuilding', path: '/suppliers' },
    { id: 'reports', label: 'Báo cáo', icon: 'FaChartLine', path: '/reports' },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleLogout = async () => {
    if (!confirm('Bạn có chắc muốn đăng xuất?')) return;
    try {
      await apiLogout();
    } catch (e) {
      // ignore server-side logout errors
    } finally {
      logout();
      navigate('/login');
    }
  };

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
            const isExpanded = expandedSections.includes(item.id);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            
            return (
              <div key={item.id} className="mb-1">
                <button
                  onClick={() => {
                    if (hasSubItems && !isSidebarCollapsed) {
                      toggleSection(item.id);
                    } else {
                      navigate(item.path);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
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
                        <span className="bg-danger text-white text-xs px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {hasSubItems && (
                        <FaChevronLeft 
                          size={12} 
                          className={`transition-transform ${isExpanded ? 'rotate-[-90deg]' : ''}`}
                        />
                      )}
                    </>
                  )}
                </button>
                
                {/* Sub-items */}
                {hasSubItems && isExpanded && !isSidebarCollapsed && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.subItems!.map(subItem => (
                      <button
                        key={subItem.id}
                        onClick={() => navigate(subItem.path)}
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                          location.pathname === subItem.path
                            ? 'bg-primary/10 text-primary dark:bg-primary/20'
                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        {!isSidebarCollapsed && (
          <div className="mt-auto border-t border-zinc-200 dark:border-zinc-800">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full p-4 flex items-center gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm truncate">{user?.name || 'Admin User'}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user?.email || 'user@example.com'}</p>
                </div>
                {userMenuOpen ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
              </button>

              {/* Dropdown menu */}
              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 mx-2 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setSettingsOpen(true);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-left"
                  >
                    <FaCog size={16} />
                    <span className="text-sm">Cài đặt</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left text-red-600 dark:text-red-500 border-t border-zinc-200 dark:border-zinc-700"
                  >
                    <FaSignOutAlt size={16} />
                    <span className="text-sm font-medium">Đăng xuất</span>
                  </button>
                </div>
              )}
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
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6 bg-zinc-50 dark:bg-zinc-950">
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
