/**
 * Icon.tsx - FontAwesome Icon wrapper
 * 
 * Sử dụng FontAwesome icons chuyên nghiệp thay vì custom SVG
 * CẤM dùng emoji icons
 */

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition, SizeProp } from '@fortawesome/fontawesome-svg-core';
import {
  // Navigation & UI
  faHome,
  faBox,
  faBoxes,
  faWarehouse,
  faExchangeAlt,
  faArrowDown,
  faArrowUp,
  faArrowLeft,
  faArrowRight,
  faBuilding,
  faChartLine,
  faChartBar,
  faChartPie,
  faUser,
  faUsers,
  faUserTie,
  faCog,
  faGear,
  faBars,
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faChevronUp,
  faAngleDown,
  faAngleUp,
  
  // Actions
  faSearch,
  faPlus,
  faMinus,
  faEdit,
  faPen,
  faTrash,
  faTrashAlt,
  faSave,
  faCheck,
  faCheckCircle,
  faTimes,
  faTimesCircle,
  faClose,
  faSignOutAlt,
  faRightFromBracket,
  
  // Status & Alerts
  faExclamationTriangle,
  faExclamationCircle,
  faInfoCircle,
  faBell,
  faCircleExclamation,
  faTriangleExclamation,
  
  // Data & Items
  faFileAlt,
  faFile,
  faFileLines,
  faClipboard,
  faClipboardList,
  faList,
  faListUl,
  faTable,
  faBarcode,
  faQrcode,
  faTag,
  faTags,
  faLayerGroup,
  
  // Time & Calendar
  faCalendar,
  faCalendarAlt,
  faCalendarDays,
  faClock,
  faHistory,
  
  // Communication
  faComment,
  faComments,
  faCommentDots,
  faMessage,
  faEnvelope,
  faPaperPlane,
  faThumbtack,
  faPaperclip,
  faMicrophone,
  faReply,
  
  // Theme
  faSun,
  faMoon,
  
  // Misc
  faEllipsisV,
  faEllipsisH,
  faFilter,
  faSort,
  faSortUp,
  faSortDown,
  faDownload,
  faUpload,
  faPrint,
  faEye,
  faEyeSlash,
  faLock,
  faUnlock,
  faKey,
  faShieldAlt,
  faTruck,
  faShippingFast,
  faDollarSign,
  faMoneyBill,
  faReceipt,
  faPercentage,
  faCubes,
  faCube,
  faArchive,
  faBoxOpen,
  faCircle,
  faSpinner,
  faGlobe,
  faLanguage,
  faImage,
  faSync,
  faRotate,
  faDatabase,
  faFileExport,
} from '@fortawesome/free-solid-svg-icons';

import {
  faCircle as faCircleRegular,
  faBell as faBellRegular,
  faCalendar as faCalendarRegular,
  faFile as faFileRegular,
  faUser as faUserRegular,
  faComment as faCommentRegular,
  faEnvelope as faEnvelopeRegular,
  faClock as faClockRegular,
  faEye as faEyeRegular,
  faSmile as faSmileRegular,
} from '@fortawesome/free-regular-svg-icons';

// Icon name mapping
const iconMap: Record<string, IconDefinition> = {
  // Navigation
  'home': faHome,
  'dashboard': faChartLine,
  'box': faBox,
  'boxes': faBoxes,
  'archive': faArchive,
  'warehouse': faWarehouse,
  'exchange': faExchangeAlt,
  'arrow-down': faArrowDown,
  'arrow-up': faArrowUp,
  'arrow-left': faArrowLeft,
  'arrow-right': faArrowRight,
  'building': faBuilding,
  'business': faBuilding,
  'chart': faChartLine,
  'chart-line': faChartLine,
  'chart-bar': faChartBar,
  'chart-pie': faChartPie,
  'stats': faChartBar,
  'user': faUser,
  'users': faUsers,
  'user-tie': faUserTie,
  'person': faUser,
  'settings': faCog,
  'cog': faCog,
  'gear': faGear,
  'menu': faBars,
  'bars': faBars,
  'chevron-left': faChevronLeft,
  'chevronLeft': faChevronLeft,
  'chevron-right': faChevronRight,
  'chevronRight': faChevronRight,
  'chevron-down': faChevronDown,
  'chevronDown': faChevronDown,
  'chevron-up': faChevronUp,
  'chevronUp': faChevronUp,
  'angle-down': faAngleDown,
  'angle-up': faAngleUp,
  
  // Actions
  'search': faSearch,
  'plus': faPlus,
  'add': faPlus,
  'minus': faMinus,
  'edit': faEdit,
  'pen': faPen,
  'trash': faTrash,
  'delete': faTrashAlt,
  'save': faSave,
  'check': faCheck,
  'checkmark': faCheck,
  'check-circle': faCheckCircle,
  'close': faTimes,
  'times': faTimes,
  'x': faTimes,
  'times-circle': faTimesCircle,
  'logout': faSignOutAlt,
  'sign-out': faRightFromBracket,
  'signOut': faSignOutAlt,
  
  // Status
  'warning': faExclamationTriangle,
  'alert': faTriangleExclamation,
  'danger': faCircleExclamation,
  'error': faTimesCircle,
  'info': faInfoCircle,
  'bell': faBell,
  'bell-outline': faBellRegular,
  'notifications': faBell,
  
  // Data
  'file': faFile,
  'file-alt': faFileAlt,
  'file-lines': faFileLines,
  'document': faFileLines,
  'clipboard': faClipboard,
  'clipboard-list': faClipboardList,
  'list': faList,
  'list-ul': faListUl,
  'table': faTable,
  'barcode': faBarcode,
  'qrcode': faQrcode,
  'tag': faTag,
  'tags': faTags,
  'layers': faLayerGroup,
  
  // Time
  'calendar': faCalendar,
  'calendar-alt': faCalendarAlt,
  'calendar-days': faCalendarDays,
  'clock': faClock,
  'clock-outline': faClockRegular,
  'history': faHistory,
  
  // Communication
  'comment': faComment,
  'comments': faComments,
  'comment-dots': faCommentDots,
  'message': faMessage,
  'chat': faComments,
  'envelope': faEnvelope,
  'mail': faEnvelope,
  'send': faPaperPlane,
  'paper-plane': faPaperPlane,
  'thumbtack': faThumbtack,
  'pin': faThumbtack,
  'paperclip': faPaperclip,
  'attachment': faPaperclip,
  'microphone': faMicrophone,
  'mic': faMicrophone,
  'reply': faReply,
  'smile': faSmileRegular,
  'smile-outline': faSmileRegular,
  'ellipsis-v': faEllipsisV,
  'ellipsis-vertical': faEllipsisV,
  'more': faEllipsisV,
  'file-export': faFileExport,
  'export': faFileExport,
  
  // Theme
  'sun': faSun,
  'moon': faMoon,
  'light': faSun,
  'dark': faMoon,
  
  // Misc
  'ellipsis-h': faEllipsisH,
  'filter': faFilter,
  'sort': faSort,
  'sort-up': faSortUp,
  'sort-down': faSortDown,
  'download': faDownload,
  'upload': faUpload,
  'print': faPrint,
  'eye': faEye,
  'eye-slash': faEyeSlash,
  'view': faEye,
  'hide': faEyeSlash,
  'lock': faLock,
  'unlock': faUnlock,
  'key': faKey,
  'shield': faShieldAlt,
  'truck': faTruck,
  'shipping': faShippingFast,
  'dollar': faDollarSign,
  'money': faMoneyBill,
  'receipt': faReceipt,
  'percent': faPercentage,
  'cubes': faCubes,
  'cube': faCube,
  'box-open': faBoxOpen,
  'package': faBox,
  'inventory': faBoxes,
  'circle': faCircle,
  'spinner': faSpinner,
  'loading': faSpinner,
  'image': faImage,
  'photo': faImage,
  
  // Additional icons
  'globe': faGlobe,
  'language': faLanguage,
  'sync': faSync,
  'refresh': faRotate,
  'database': faDatabase,
};

export interface IconProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2x';
  className?: string;
  spin?: boolean;
  onClick?: () => void;
}

const sizeMap: Record<string, SizeProp> = {
  'xs': 'xs',
  'sm': 'sm',
  'md': '1x',
  'lg': 'lg',
  'xl': 'xl',
  '2x': '2x',
};

export default function Icon({ 
  name, 
  size = 'md', 
  className = '',
  spin = false,
  onClick,
}: IconProps) {
  const icon = iconMap[name];
  
  if (!icon) {
    console.warn(`[Icon] Unknown icon name: "${name}"`);
    return null;
  }
  
  return (
    <FontAwesomeIcon 
      icon={icon} 
      size={sizeMap[size]}
      className={className}
      spin={spin}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    />
  );
}

// Convenient pre-configured icons
export const HomeIcon = (props: Omit<IconProps, 'name'>) => <Icon name="home" {...props} />;
export const DashboardIcon = (props: Omit<IconProps, 'name'>) => <Icon name="dashboard" {...props} />;
export const BoxIcon = (props: Omit<IconProps, 'name'>) => <Icon name="box" {...props} />;
export const WarehouseIcon = (props: Omit<IconProps, 'name'>) => <Icon name="warehouse" {...props} />;
export const ChartIcon = (props: Omit<IconProps, 'name'>) => <Icon name="chart" {...props} />;
export const UserIcon = (props: Omit<IconProps, 'name'>) => <Icon name="user" {...props} />;
export const SettingsIcon = (props: Omit<IconProps, 'name'>) => <Icon name="settings" {...props} />;
export const SearchIcon = (props: Omit<IconProps, 'name'>) => <Icon name="search" {...props} />;
export const PlusIcon = (props: Omit<IconProps, 'name'>) => <Icon name="plus" {...props} />;
export const EditIcon = (props: Omit<IconProps, 'name'>) => <Icon name="edit" {...props} />;
export const TrashIcon = (props: Omit<IconProps, 'name'>) => <Icon name="trash" {...props} />;
export const WarningIcon = (props: Omit<IconProps, 'name'>) => <Icon name="warning" {...props} />;
export const BellIcon = (props: Omit<IconProps, 'name'>) => <Icon name="bell" {...props} />;
export const SunIcon = (props: Omit<IconProps, 'name'>) => <Icon name="sun" {...props} />;
export const MoonIcon = (props: Omit<IconProps, 'name'>) => <Icon name="moon" {...props} />;
export const SpinnerIcon = (props: Omit<IconProps, 'name'>) => <Icon name="spinner" spin {...props} />;
