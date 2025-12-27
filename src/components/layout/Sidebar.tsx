import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from 'react-router-dom';
import {
  Package, Users, BarChart3, Settings, Tag, User2Icon,
  LayoutGrid, UtensilsCrossed, CalendarDays, Warehouse, FileSpreadsheet,
  Store // <-- Import thêm icon Store (Cửa hàng)
} from 'lucide-react';

interface SidebarProps {
  currentPath?: string;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  allowedRoles: string[];
  group: 'operation' | 'management';
  iconColor: string; 
  activeBg: string; 
}

const Sidebar: React.FC<SidebarProps> = () => {
  const { user } = useAuth();
  const currentRole = user?.type || "";

  // --- GIỮ NGUYÊN TOÀN BỘ CONFIG CŨ ---
  const navItems: NavItem[] = [
    { path: '/', label: 'Sơ đồ bàn', icon: LayoutGrid, allowedRoles: ['admin', 'staff'], group: 'operation', iconColor: 'text-indigo-600 dark:text-indigo-400', activeBg: 'bg-indigo-600 shadow-indigo-200 dark:shadow-none' },
    { path: '/menu', label: 'Thực đơn', icon: UtensilsCrossed, allowedRoles: ['admin', 'staff'], group: 'operation', iconColor: 'text-orange-500 dark:text-orange-400', activeBg: 'bg-orange-500 shadow-orange-200 dark:shadow-none' },
    { path: '/reservations', label: 'Đặt bàn', icon: CalendarDays, allowedRoles: ['admin', 'staff'], group: 'operation', iconColor: 'text-sky-500 dark:text-sky-400', activeBg: 'bg-sky-500 shadow-sky-200 dark:shadow-none' },
    { path: '/orders-management', label: 'Đơn hàng', icon: Package, allowedRoles: ['admin', 'staff'], group: 'operation', iconColor: 'text-emerald-500 dark:text-emerald-400', activeBg: 'bg-emerald-500 shadow-emerald-200 dark:shadow-none' },
    { path: '/customer-management', label: 'Khách hàng', icon: User2Icon, allowedRoles: ['admin', 'staff'], group: 'operation', iconColor: 'text-blue-500 dark:text-blue-400', activeBg: 'bg-blue-500 shadow-blue-200 dark:shadow-none' },
    
    // MANAGEMENT
    { path: '/inventory', label: 'Kho hàng', icon: Warehouse, allowedRoles: ['admin'], group: 'management', iconColor: 'text-slate-600 dark:text-slate-400', activeBg: 'bg-slate-600 shadow-slate-200 dark:shadow-none' },
    { path: '/masterdata', label: 'Danh mục', icon: FileSpreadsheet, allowedRoles: ['admin'], group: 'management', iconColor: 'text-teal-600 dark:text-teal-400', activeBg: 'bg-teal-600 shadow-teal-200 dark:shadow-none' },
    { path: '/reports', label: 'Báo cáo', icon: BarChart3, allowedRoles: ['admin'], group: 'management', iconColor: 'text-rose-500 dark:text-rose-400', activeBg: 'bg-rose-500 shadow-rose-200 dark:shadow-none' },
    { path: '/employees', label: 'Nhân viên', icon: Users, allowedRoles: ['admin'], group: 'management', iconColor: 'text-violet-600 dark:text-violet-400', activeBg: 'bg-violet-600 shadow-violet-200 dark:shadow-none' },
    { path: '/promotions', label: 'Khuyến mãi', icon: Tag, allowedRoles: ['admin'], group: 'management', iconColor: 'text-pink-500 dark:text-pink-400', activeBg: 'bg-pink-500 shadow-pink-200 dark:shadow-none' },
    { path: '/settings', label: 'Cài đặt', icon: Settings, allowedRoles: ['admin'], group: 'management', iconColor: 'text-gray-600 dark:text-gray-400', activeBg: 'bg-gray-600 shadow-gray-200 dark:shadow-none' },
  ];

  const filteredNavItems = navItems.filter(item => item.allowedRoles.includes(currentRole));

  const renderNavItem = (item: NavItem) => {
    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.path === "/"}
        className={({ isActive }) => {
            const baseClass = "group flex items-center px-3 py-3 mb-2 mx-4 rounded-xl transition-all duration-300 font-medium cursor-pointer";
            const activeClass = `${item.activeBg} text-white shadow-md transform scale-105`; 
            const inactiveClass = "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:pl-5";

            return isActive ? `${baseClass} ${activeClass}` : `${baseClass} ${inactiveClass}`;
        }}
      >
        {({ isActive }) => (
          <>
            <item.icon 
                className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-white' : item.iconColor}`} 
                strokeWidth={isActive ? 2.5 : 2}
            />
            <span className="hidden md:block ml-3 text-sm font-semibold">
                {item.label}
            </span>
            
            {!isActive && (
                 <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.iconColor.replace('text-', 'bg-')} dark:bg-current`}></div>
                 </div>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <div className="h-screen w-20 md:w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col shadow-2xl z-50 font-sans transition-colors duration-300">
      
      {/* --- PHẦN LOGO MỚI (ICON STORE + CHỮ KHÁC) --- */}
      <div className="flex items-center justify-center md:justify-start md:px-6 h-24 border-b border-gray-100 dark:border-gray-800 mb-2">
        {/* Icon Store: Dùng nền Gradient Cam-Đỏ (Tạo cảm giác năng động, F&B) */}
        <div className="relative group cursor-pointer">
            <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 dark:shadow-none transform transition-transform duration-300 group-hover:scale-105">
                <Store className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            {/* Chấm xanh trạng thái */}
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 border-[3px] border-white dark:border-gray-900 rounded-full"></div>
        </div>
        
      
        <div className="hidden md:flex flex-col ml-3 justify-center">
            <h1 className="text-xl font-black tracking-tight text-gray-800 dark:text-white leading-none uppercase">
                Viet <span className="text-rose-600">Rest</span>
            </h1>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mt-1">
                Trang quản trị
            </span>
        </div>
      </div>
      {/* --- KẾT THÚC LOGO --- */}

      {/* NAVIGATION GIỮ NGUYÊN */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <div className="mb-6">
            <p className="hidden md:block px-6 mb-3 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Khu vực vận hành</p>
            {filteredNavItems.filter(i => i.group === 'operation').map(renderNavItem)}
        </div>

        {filteredNavItems.some(i => i.group === 'management') && (
            <div className="mb-6">
                <p className="hidden md:block px-6 mb-3 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Khu vực quản trị</p>
                {filteredNavItems.filter(i => i.group === 'management').map(renderNavItem)}
            </div>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;