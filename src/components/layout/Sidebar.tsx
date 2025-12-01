import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from 'react-router-dom';
import {
  Package, Users, ChefHat, BarChart3, Settings, Tag, User2Icon,
  LayoutGrid, UtensilsCrossed, CalendarDays, Warehouse, FileSpreadsheet,
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

  // Config giữ nguyên
  const navItems: NavItem[] = [
    // --- GIỮ NGUYÊN CONFIG CŨ CỦA BẠN Ở ĐÂY ---
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
            
            // ACTIVE: Giữ nguyên nền màu, nhưng bỏ shadow hoặc làm tối shadow trong Dark Mode
            const activeClass = `${item.activeBg} text-white shadow-md transform scale-105`; 
            
            // INACTIVE: 
            // Light: Text xám đậm, Hover xám nhạt
            // Dark: Text xám nhạt (gray-300), Hover xám đậm (gray-800)
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
    // CONTAINER CHÍNH: Thêm dark:bg-gray-900 và dark:border-gray-800
    <div className="h-screen w-20 md:w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col shadow-2xl z-50 font-sans transition-colors duration-300">
      
      {/* LOGO: Thêm border dark */}
      <div className="flex items-center justify-center md:justify-start md:px-6 h-24 border-b border-gray-100 dark:border-gray-800 mb-2">
        <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <ChefHat className="w-7 h-7 text-white" />
            </div>
        </div>
        
        <div className="hidden md:block ml-4">
            {/* Chữ POS Pro sáng lên trong DarkMode */}
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 tracking-tight">POS Pro</h1>
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full uppercase tracking-wider">Manager</span>
        </div>
      </div>

      {/* NAVIGATION */}
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

      {/* FOOTER USER PROFILE */}
      {/* <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="hidden md:block ml-3 overflow-hidden">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-indigo-900 dark:group-hover:text-white">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300">{currentRole === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</p>
            </div>
        </div>
      </div> */}
    </div>
  );
};

export default Sidebar;