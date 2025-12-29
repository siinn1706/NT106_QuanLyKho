/**
 * UI Components Index
 * 
 * Export tất cả UI components từ một nơi
 * 
 * Usage:
 * import { Button, Card, Badge, Input } from '@/components/ui';
 * import Icon from '@/components/ui/Icon';
 */

// Icon (FontAwesome-based)
export { default as Icon } from './Icon';
export type { IconProps } from './Icon';
export {
  HomeIcon,
  DashboardIcon,
  BoxIcon,
  WarehouseIcon,
  ChartIcon,
  UserIcon,
  SettingsIcon,
  SearchIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  WarningIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  SpinnerIcon,
} from './Icon';

// CustomSelect (dropdown với bo tròn)
export { default as CustomSelect } from './CustomSelect';
export type { CustomSelectProps, SelectOption } from './CustomSelect';

// Button
export { default as Button } from './Button';
export type { ButtonProps } from './Button';
export { PrimaryButton, SecondaryButton, GhostButton, DestructiveButton } from './Button';

// Input
export { Input, Select, Textarea, SearchInput } from './Input';
export type { InputProps, SelectProps, TextareaProps, SearchInputProps } from './Input';

// Card
export { default as Card } from './Card';
export type { CardProps } from './Card';
export { CardHeader, CardContent, CardFooter, StatCard, Panel } from './Card';
export type { CardHeaderProps, CardContentProps, CardFooterProps, StatCardProps, PanelProps } from './Card';

// Badge
export { default as Badge } from './Badge';
export type { BadgeProps, BadgeVariant } from './Badge';
export { StatusPill, CountBadge, StockBadge, TransactionBadge } from './Badge';
export type { 
  StatusPillProps, 
  StatusType, 
  CountBadgeProps, 
  StockBadgeProps, 
  StockStatus,
  TransactionBadgeProps,
  TransactionType
} from './Badge';

// Table
export { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell,
  TableEmpty,
  TableLoading
} from './Table';
export type { 
  TableProps, 
  TableHeaderProps, 
  TableBodyProps, 
  TableRowProps, 
  TableHeadProps, 
  TableCellProps,
  TableEmptyProps,
  TableLoadingProps
} from './Table';

// Modal
export { default as Modal } from './Modal';
export type { ModalProps } from './Modal';
export { ModalFooter, ConfirmDialog } from './Modal';
export type { ModalFooterProps, ConfirmDialogProps } from './Modal';

// PasskeyModal - Modal xác thực passkey 6 số
export { default as PasskeyModal } from './PasskeyModal';

// SupplierAutocomplete - Input với gợi ý nhà cung cấp
export { default as SupplierAutocomplete } from './SupplierAutocomplete';

// ProductCodeInput - Component nhập mã sản phẩm với auto-lookup
export { default as ProductCodeInput, ProductInfoDisplay } from './ProductCodeInput';
