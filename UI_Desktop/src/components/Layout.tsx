import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '../state/ui_store';
import { useThemeStore } from '../theme/themeStore';
import { useAuthStore } from '../state/auth_store';
import { useCompanyStore } from '../state/company_store';
import ChatWidget from './chat/ChatWidget';
import SettingsModal from './SettingsModal';
import GlobalSearch from './GlobalSearch';
import NotificationsPanel from './NotificationsPanel';
import { apiLogout, BASE_URL } from '../app/api_client';
import Icon from './ui/Icon';
import { useKeyboardShortcuts, commonShortcuts } from '../hooks/useKeyboardShortcuts';
import { useNotificationBadges } from '../hooks/useNotificationBadges';
import { useNavigationTracking } from '../hooks/useNavigationTracking';

interface LayoutProps {
  children: ReactNode;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
  showDotOnly?: boolean;
  subItems?: { id: string; label: string; path: string; badge?: number; }[];
}

export default function Layout({ children }: LayoutProps) {
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const { user, logout } = useAuthStore();
  const { warehouses, activeWarehouseId } = useCompanyStore();
  const activeWarehouse = warehouses.find(wh => wh.id === activeWarehouseId);
  const navigate = useNavigate();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'company' | 'warehouse' | 'account' | 'notifications' | 'about'>('general');
  const [expandedSections, setExpandedSections] = useState<string[]>(['items']);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const badges = useNotificationBadges();
  
  useNavigationTracking();

  const menuItems: MenuItem[] = [
    { 
      id: 'home', 
      label: 'Trang chủ', 
      icon: 'home', 
      path: '/dashboard',
      badge: badges.home
    },
    { 
      id: 'items', 
      label: 'Hàng hoá', 
      icon: 'box', 
      path: '/items',
      badge: badges.items,
      showDotOnly: true,
      subItems: [
        { id: 'item-list', label: 'Danh sách hàng', path: '/items' },
        { id: 'item-tracking', label: 'Theo dõi hàng', path: '/items/tracking' },
        { id: 'item-alerts', label: 'Cảnh báo tồn kho', path: '/items/alerts', badge: badges.itemsAlerts }
      ]
    },
    { 
      id: 'stock', 
      label: 'Nhập/Xuất kho', 
      icon: 'exchange', 
      path: '/stock',
      badge: 0,
      subItems: [
        { id: 'stock-in', label: 'Nhập kho', path: '/stock/in', badge: 0 },
        { id: 'stock-out', label: 'Xuất kho', path: '/stock/out', badge: 0 }
      ]
    },
    { 
      id: 'suppliers', 
      label: 'Nhà cung cấp', 
      icon: 'building', 
      path: '/suppliers',
      badge: badges.suppliers
    },
    { 
      id: 'warehouses', 
      label: 'Kho hàng', 
      icon: 'warehouse', 
      path: '/warehouses',
      badge: badges.warehouses
    },
    { 
      id: 'reports', 
      label: 'Báo cáo', 
      icon: 'chart', 
      path: '/reports',
      badge: badges.reports
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (e) {
      // ignore errors
    } finally {
      logout();
      navigate('/login');
    }
  };

  const getPageInfo = () => {
    const path = location.pathname;
    
    if (path === '/dashboard') return { title: 'Trang chủ', subtitle: null };
    
    if (path === '/items') return { title: 'Hàng hoá', subtitle: 'Danh sách hàng hoá' };
    if (path === '/items/tracking') return { title: 'Hàng hoá', subtitle: 'Theo dõi hàng hoá' };
    if (path === '/items/alerts') return { title: 'Hàng hoá', subtitle: 'Cảnh báo tồn kho' };
    
    if (path === '/stock') return { title: 'Nhập/Xuất kho', subtitle: null };
    if (path === '/stock/in') return { title: 'Nhập/Xuất kho', subtitle: 'Nhập kho' };
    if (path === '/stock/out') return { title: 'Nhập/Xuất kho', subtitle: 'Xuất kho' };
    
    if (path === '/suppliers') return { title: 'Nhà cung cấp', subtitle: null };
    if (path === '/warehouses') return { title: 'Kho hàng', subtitle: null };
    if (path === '/reports') return { title: 'Báo cáo', subtitle: null };
    
    return { title: 'Trang chủ', subtitle: null };
  };

  const pageInfo = getPageInfo();

  useKeyboardShortcuts([
    ...commonShortcuts,
    {
      key: '1',
      ctrl: true,
      action: () => navigate('/dashboard'),
      description: 'Về trang chủ',
    },
    {
      key: '2',
      ctrl: true,
      action: () => navigate('/items'),
      description: 'Mở hàng hóa',
    },
    {
      key: '3',
      ctrl: true,
      action: () => navigate('/stock'),
      description: 'Mở nhập/xuất kho',
    },
  ]);

  return (
    <div className="flex h-screen bg-[var(--bg)] text-[var(--text-1)]">
      {/* Sidebar with glass effect */}
      <aside
        className={`${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        } bg-[var(--surface-1)]/80 backdrop-blur-xl border-r dark:border-zinc-800 border-zinc-300 transition-all duration-200 ease-out flex flex-col overflow-hidden`}
      >
        <div className={`h-16 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} px-4 border-b dark:border-zinc-800 border-zinc-300`}>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                <img src="/logo.png" alt="N3T Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-semibold text-lg whitespace-nowrap">Quản lý Kho</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="liquid-glass-icon-btn w-10 h-10 flex items-center justify-center flex-shrink-0"
            title={isSidebarCollapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            <Icon name={isSidebarCollapsed ? 'bars' : 'chevron-left'} size="md" />
          </button>
        </div>
        
        <nav className="flex-1 p-3 overflow-y-auto scrollbar-thin">
          {menuItems.map((item) => {
            const isExpanded = expandedSections.includes(item.id);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            
            // Check if current path matches item or any of its subitems
            const isActive = location.pathname === item.path || 
              (hasSubItems && item.subItems!.some(subItem => location.pathname === subItem.path));
            
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
                    isSidebarCollapsed ? 'justify-center p-3 relative' : 'gap-3 px-4 py-3'
                  } rounded-[var(--radius-xl)] transition-all duration-150 ${
                    isActive
                      ? 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/20'
                      : 'hover:bg-[var(--surface-2)] border border-transparent'
                  }`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon name={item.icon === 'home' ? 'home' : item.icon === 'box' ? 'box' : item.icon === 'exchange' ? 'exchange' : item.icon === 'building' ? 'building' : item.icon === 'warehouse' ? 'warehouse' : item.icon === 'chart' ? 'chart-bar' : item.icon} size={isSidebarCollapsed ? 'lg' : 'md'} className="flex-shrink-0" />
                  {isSidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                    item.showDotOnly ? (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--danger)] rounded-full shadow-sm"></span>
                    ) : (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--danger)] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )
                  )}
                  {!isSidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left font-medium whitespace-nowrap">
                        {item.label}
                      </span>
                      {item.badge !== undefined && item.badge > 0 && (
                        item.showDotOnly ? (
                          <span className="w-2 h-2 bg-[var(--danger)] rounded-full flex-shrink-0"></span>
                        ) : (
                          <span className="bg-[var(--danger)] text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0 min-w-[20px] text-center">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )
                      )}
                      {hasSubItems && (
                        <Icon name="chevron-left" size="sm" className={`flex-shrink-0 transition-transform duration-200 ${
                            isExpanded ? 'rotate-[-90deg]' : ''
                          }`} />
                      )}
                    </>
                  )}
                </button>
                
                {hasSubItems && isExpanded && !isSidebarCollapsed && (
                  <div className="ml-9 mt-1.5 space-y-1">
                    {item.subItems!.map(subItem => (
                      <button
                        key={subItem.id}
                        onClick={() => navigate(subItem.path)}
                        className={`w-full flex items-center gap-2 text-left px-4 py-2.5 rounded-[var(--radius-md)] text-sm transition-colors duration-150 ${
                          location.pathname === subItem.path
                            ? 'bg-[var(--primary-light)] text-[var(--primary)] font-medium'
                            : 'hover:bg-[var(--surface-2)] text-[var(--text-2)]'
                        }`}
                      >
                        <span className="flex-1">{subItem.label}</span>
                        {subItem.badge !== undefined && subItem.badge > 0 && (
                          <span className="bg-[var(--danger)] text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0 min-w-[20px] text-center">
                            {subItem.badge > 99 ? '99+' : subItem.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className={`mt-auto border-t dark:border-zinc-800 border-zinc-300 transition-opacity duration-200 ${
          isSidebarCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'
        }`}>
          <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full p-4 flex items-center gap-3 hover:bg-[var(--surface-2)]/70 transition-all duration-150"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/20 overflow-hidden">
                  {user?.avatar_url ? (
                    <img 
                      src={user.avatar_url.startsWith('http') ? user.avatar_url : `${BASE_URL}${user.avatar_url}`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = `<span class="text-sm font-bold">${user?.display_name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}</span>`;
                        }
                      }}
                    />
                  ) : (
                    <span>{user?.display_name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm truncate whitespace-nowrap">{user?.display_name || user?.username || 'Admin User'}</p>
                  <p className="text-xs text-[var(--text-3)] truncate whitespace-nowrap">{user?.email || 'user@example.com'}</p>
                </div>
                <Icon name={userMenuOpen ? 'chevron-up' : 'chevron-down'} size="sm" className="flex-shrink-0" />
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 mx-2 liquid-glass-dropdown animate-glass-in">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setSettingsTab('company');
                      setSettingsOpen(true);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--surface-2)]/70 transition-all duration-150 text-left"
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
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--surface-2)]/70 transition-all duration-150 text-left border-t dark:border-zinc-800 border-zinc-300"
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
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--surface-2)]/70 transition-all duration-150 text-left border-t dark:border-zinc-800 border-zinc-300"
                  >
                    <Icon name="settings" size="md" />
                    <span className="text-sm">Cài đặt</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-500/10 transition-all duration-150 text-left text-[var(--danger)] border-t dark:border-zinc-800 border-zinc-300"
                  >
                    <Icon name="logout" size="md" />
                    <span className="text-sm font-medium">Đăng xuất</span>
                  </button>
                </div>
              )}
          </div>
        </div>
      </aside>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with subtle glass effect */}
        <header className="h-16 bg-[var(--surface-1)]/80 backdrop-blur-xl border-b dark:border-zinc-800 border-zinc-300 flex items-center justify-between px-6 relative z-50">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold leading-none">{pageInfo.title}</h1>
            {pageInfo.subtitle && (
              <>
                <Icon name="chevron-right" size="xs" className="text-[var(--text-3)]" />
                <span className="text-base text-[var(--text-2)] leading-none">
                  {pageInfo.subtitle}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeWarehouse && (
              <button
                onClick={() => {
                  setSettingsTab('warehouse');
                  setSettingsOpen(true);
                }}
                className="liquid-glass-badge flex items-center gap-2 px-3 py-1.5 text-sm font-medium cursor-pointer"
                title="Nhấn để chuyển kho"
              >
                <Icon name="warehouse" size="sm" />
                <span className="max-w-[150px] truncate">{activeWarehouse.code}</span>
              </button>
            )}
            <GlobalSearch />
            <NotificationsPanel />
            <button
              onClick={toggleDarkMode}
              className="liquid-glass-icon-btn p-2"
              title={isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}
            >
              <Icon name={isDarkMode ? 'sun' : 'moon'} size="lg" />
            </button>
            <button
              onClick={() => {
                setSettingsTab('general');
                setSettingsOpen(true);
              }}
              className="liquid-glass-icon-btn p-2"
              title="Cài đặt"
            >
              <Icon name="settings" size="lg" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6 bg-[var(--bg)]">
          {children}
        </main>
      </div>
      <ChatWidget />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} initialTab={settingsTab} />
    </div>
  );
}