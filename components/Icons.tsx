import React from 'react';

// ----------------------------------------------------------------------
// 1. Lấy Icon từ thư viện lucide-react (Code chuẩn)
// ----------------------------------------------------------------------
export {
  LayoutGrid as GridIcon,
  Menu as MenuIcon,
  BarChart3 as ChartIcon,
  Settings as SettingsIcon,
  PlusCircle as PlusCircleIcon,
  X as XIcon,
  Trash2 as TrashIcon,
  ChefHat as ChefHatIcon,
  Pencil as EditIcon,
  Plus as PlusIcon,
  ChevronDown as ChevronDownIcon,
  CheckCircle2 as CheckCircleIcon,
  Info as InfoIcon,
  AlertTriangle as AlertTriangleIcon,
  AlertOctagon as AlertOctagonIcon,
} from 'lucide-react';

// ----------------------------------------------------------------------
// 2. Định nghĩa các Icon Custom (Không có trong list trên nên phải tự vẽ)
// ----------------------------------------------------------------------

type IconProps = {
    className?: string;
};

// 🚀 ICON MỚI: UsersIcon (Icon nhiều khách hàng / cộng đồng)
export const UsersIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);

// 🖨️ ICON MỚI: PrinterIcon
export const PrinterIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.198-.54-1.214-1.201L6 18m5 2v3m-3-3v3m3-3h3m-3 3h3m-5.593-14.72c.062.232.126.464.195.696a20.583 20.583 0 002.885 6.98 20.587 20.587 0 002.886-6.98c.068-.232.133-.464.195-.696m-7.962-1.11c-.074.244-.146.49-.214.738a20.647 20.647 0 00-1.938 7.735 20.65 20.65 0 001.938 7.735c.068.248.14.494.214.738" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V5.25A2.25 2.25 0 018.25 3h7.5A2.25 2.25 0 0118 5.25V9m-12 0v3a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 12V9" />
    </svg>
);