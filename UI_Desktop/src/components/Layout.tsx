import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '../state/ui_store';
import { useAuthStore } from '../state/auth_store';
import { useCompanyStore } from '../state/company_store';
import ChatWidget from './chat/ChatWidget';
import SettingsModal from './SettingsModal';
import { apiLogout } from '../app/api_client';
import Icon from './ui/Icon';

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
  const { warehouses, activeWarehouseId } = useCompanyStore();
  const activeWarehouse = warehouses.find(wh => wh.id === activeWarehouseId);
  const navigate = useNavigate();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'company' | 'warehouse' | 'account' | 'notifications' | 'about'>('general');
  const [expandedSections, setExpandedSections] = useState<string[]>(['items']);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const menuItems: MenuItem[] = [
    { id: 'home', label: 'Trang chủ', icon: 'home', path: '/dashboard' },
    { 
      id: 'items', 
      label: 'Hàng hoá', 
      icon: 'box', 
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
      icon: 'exchange', 
      path: '/stock', 
      badge: 14,
      subItems: [
        { id: 'stock-in', label: 'Nhập kho', path: '/stock/in' },
        { id: 'stock-out', label: 'Xuất kho', path: '/stock/out' }
      ]
    },
    { id: 'suppliers', label: 'Nhà cung cấp', icon: 'building', path: '/suppliers' },
    { id: 'reports', label: 'Báo cáo', icon: 'chart', path: '/reports' },
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

  const getPageInfo = () => {
    const path = location.pathname;
    
    // Dashboard
    if (path === '/dashboard') {
      return { title: 'Trang chủ', subtitle: null };
    }
    
    // Hàng hoá
    if (path === '/items') {
      return { title: 'Hàng hoá', subtitle: 'Danh sách hàng hoá' };
    }
    if (path === '/items/tracking') {
      return { title: 'Hàng hoá', subtitle: 'Theo dõi hàng hoá' };
    }
    if (path === '/items/alerts') {
      return { title: 'Hàng hoá', subtitle: 'Cảnh báo tồn kho' };
    }
    
    // Nhập/Xuất kho
    if (path === '/stock') {
      return { title: 'Nhập/Xuất kho', subtitle: null };
    }
    if (path === '/stock/in') {
      return { title: 'Nhập/Xuất kho', subtitle: 'Nhập kho' };
    }
    if (path === '/stock/out') {
      return { title: 'Nhập/Xuất kho', subtitle: 'Xuất kho' };
    }
    
    // Nhà cung cấp
    if (path === '/suppliers') {
      return { title: 'Nhà cung cấp', subtitle: null };
    }
    
    // Báo cáo
    if (path === '/reports') {
      return { title: 'Báo cáo', subtitle: null };
    }
    
    // Default
    return { title: 'Trang chủ', subtitle: null };
  };

  const pageInfo = getPageInfo();

  return (
    <div className="flex h-screen bg-[var(--bg)] text-[var(--text-1)]">
      {/* Sidebar trái - border-based depth, không shadow */}
      <aside
        className={`${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        } bg-[var(--surface-1)] border-r border-[var(--border)] transition-all duration-200 ease-out flex flex-col overflow-hidden`}
      >
        <div className={`h-16 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} px-4 border-b border-[var(--border)]`}>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                <img src="/src/resources/logo.png" alt="N3T Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-semibold text-lg whitespace-nowrap">Quản lý Kho</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="w-10 h-10 flex items-center justify-center hover:bg-[var(--surface-2)] rounded-[var(--radius-md)] transition-colors duration-150 flex-shrink-0"
            title={isSidebarCollapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            <Icon name={isSidebarCollapsed ? 'bars' : 'chevronLeft'} size="md" />
          </button>
        </div>
        {/* Menu items */}
        <nav className="flex-1 p-3 overflow-y-auto scrollbar-thin">
          {menuItems.map((item) => {
            const isExpanded = expandedSections.includes(item.id);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            
            return (
              <div key={item.id} className="mb-2">
                <button
                  onClick={() => {
                    if (hasSubItems && !isSidebarCollapsed) {
                      toggleSection(item.id);
                    } else {
                      navigate(item.path);
                    }
                  }}
                  className={`w-full flex items-center ${
                    isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
                  } rounded-[var(--radius-xl)] transition-all duration-150 ${
                    location.pathname === item.path
                      ? 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/20'
                      : 'hover:bg-[var(--surface-2)] border border-transparent'
                  }`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon name={item.icon} size={isSidebarCollapsed ? 'lg' : 'md'} className="flex-shrink-0" />
                  {!isSidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left font-medium whitespace-nowrap">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="bg-[var(--danger)] text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                          {item.badge}
                        </span>
                      )}
                      {hasSubItems && (
                        <Icon 
                          name="chevronLeft" 
                          size="sm" 
                          className={`flex-shrink-0 transition-transform duration-200 ${
                            isExpanded ? 'rotate-[-90deg]' : ''
                          }`}
                        />
                      )}
                    </>
                  )}
                </button>
                
                {/* Sub-items */}
                {hasSubItems && isExpanded && !isSidebarCollapsed && (
                  <div className="ml-9 mt-1.5 space-y-1">
                    {item.subItems!.map(subItem => (
                      <button
                        key={subItem.id}
                        onClick={() => navigate(subItem.path)}
                        className={`w-full text-left px-4 py-2.5 rounded-[var(--radius-md)] text-sm transition-colors duration-150 ${
                          location.pathname === subItem.path
                            ? 'bg-[var(--primary-light)] text-[var(--primary)] font-medium'
                            : 'hover:bg-[var(--surface-2)] text-[var(--text-2)]'
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
        <div className={`mt-auto border-t border-[var(--border)] transition-opacity duration-200 ${
          isSidebarCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'
        }`}>
          <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full p-4 flex items-center gap-3 hover:bg-[var(--surface-2)] transition-colors duration-150"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm truncate whitespace-nowrap">{user?.name || 'Admin User'}</p>
                  <p className="text-xs text-[var(--text-3)] truncate whitespace-nowrap">{user?.email || 'user@example.com'}</p>
                </div>
                <Icon name={userMenuOpen ? 'chevronUp' : 'chevronDown'} size="sm" className="flex-shrink-0" />
              </button>

              {/* Dropdown menu - border-based, no shadow */}
              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 mx-2 bg-[var(--surface-1)] rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setSettingsTab('company');
                      setSettingsOpen(true);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--surface-2)] transition-colors duration-150 text-left"
                  >
                    <Icon name="building" size="md" />
                    <span className="text-sm">Công ty</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setSettingsTab('warehouse');
                      setSettingsOpen(true);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--surface-2)] transition-colors duration-150 text-left border-t border-[var(--border)]"
                  >
                    <Icon name="warehouse" size="md" />
                    <span className="text-sm">Kho hàng</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setSettingsTab('general');
                      setSettingsOpen(true);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--surface-2)] transition-colors duration-150 text-left border-t border-[var(--border)]"
                  >
                    <Icon name="cog" size="md" />
                    <span className="text-sm">Cài đặt</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 text-left text-[var(--danger)] border-t border-[var(--border)]"
                  >
                    <Icon name="signOut" size="md" />
                    <span className="text-sm font-medium">Đăng xuất</span>
                  </button>
                </div>
              )}
          </div>
        </div>
      </aside>
      {/* Nội dung chính */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-[var(--surface-1)] border-b border-[var(--border)] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold leading-none">{pageInfo.title}</h1>
            {pageInfo.subtitle && (
              <>
                <Icon name="chevronRight" size="xs" className="text-[var(--text-3)]" />
                <span className="text-base text-[var(--text-2)] leading-none">
                  {pageInfo.subtitle}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Active Warehouse indicator */}
            {activeWarehouse && (
              <button
                onClick={() => {
                  setSettingsTab('warehouse');
                  setSettingsOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--primary-light)] text-[var(--primary)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--primary)]/20 transition-colors cursor-pointer"
                title="Nhấn để chuyển kho"
              >
                <Icon name="warehouse" size="sm" />
                <span className="max-w-[150px] truncate">{activeWarehouse.code}</span>
              </button>
            )}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm hàng hoá, báo cáo..."
                className="w-80 pl-10 pr-4 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all duration-150"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]"><Icon name="search" size="md" /></span>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 hover:bg-[var(--surface-2)] rounded-[var(--radius-md)] transition-colors duration-150"
              title={isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}
            >
              <Icon name={isDarkMode ? 'sun' : 'moon'} size="lg" />
            </button>
            <button
              onClick={() => {
                setSettingsTab('general');
                setSettingsOpen(true);
              }}
              className="p-2 hover:bg-[var(--surface-2)] rounded-[var(--radius-md)] transition-colors duration-150"
              title="Cài đặt"
            >
              <Icon name="cog" size="lg" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6 bg-[var(--bg)]">
          {children}
        </main>
      </div>
      {/* ChatWidget luôn xuất hiện ở mọi trang */}
      <ChatWidget />
      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} initialTab={settingsTab} />
    </div>
  );
}
