import React from 'react';
import type { View } from '@/types';
import { Tag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Package,
  Users,
  ChefHat,
  BarChart3,
  Settings,
} from 'lucide-react';
import { NavLink } from 'react-router-dom'; 

import { ChefHatIcon, GridIcon, MenuIcon, ChartIcon, SettingsIcon } from '@/components/icons';

interface SidebarProps { 
    currentPath: string; 
}

// 1. Định nghĩa kiểu dữ liệu cho NavItem có thêm quyền hạn
interface NavItem {
    path: string;
    label: string;
    icon: React.ElementType;
    allowedRoles: string[]; // Mảng chứa các role được phép thấy
}

const Sidebar: React.FC<SidebarProps> = ({currentPath}) => { 
    const { user } = useAuth();
    
    // Lấy role hiện tại của user (admin hoặc staff)
    // Lưu ý: Đảm bảo user.type trả về đúng chuỗi 'admin' hoặc 'staff' giống như trong database/auth
    const currentRole = user?.type || ""; 

    // 2. Cấu hình danh sách menu kèm theo quyền hạn (đồng bộ với route.tsx)
    const navItems: NavItem[] = [
        // --- NHÓM CHUNG (Admin & Staff) ---
        { path: '/', label: 'Sơ đồ bàn', icon: GridIcon, allowedRoles: ['admin', 'staff'] },
        { path: '/menu', label: 'Thực đơn', icon: MenuIcon, allowedRoles: ['admin', 'staff'] },
        { path: '/reservations', label: 'Đặt bàn', icon: GridIcon, allowedRoles: ['admin', 'staff'] },
        { path: '/orders-management', label: 'Quản lý đơn hàng', icon: Package, allowedRoles: ['admin', 'staff'] },
        
        // --- NHÓM CHỈ QUẢN LÝ (Admin) ---
        { path: '/inventory', label: 'Kho', icon: MenuIcon, allowedRoles: ['admin'] },
        { path: '/masterdata', label: 'Danh mục', icon: SettingsIcon, allowedRoles: ['admin'] },
        { path: '/reports', label: 'Báo cáo', icon: ChartIcon, allowedRoles: ['admin'] },
        { path: '/employees', label: 'Nhân viên', icon: Users, allowedRoles: ['admin'] }, 
        { path: '/settings', label: 'Cài đặt', icon: SettingsIcon, allowedRoles: ['admin'] },
         { path: '/promotions', label: 'Khuyến mãi', icon: Tag, allowedRoles: ['admin'] },
        
        // Màn hình bếp (Nếu sau này mở lại thì thêm role vào)
        // { path: '/kds', label: 'Màn hình bếp', icon: ChefHatIcon, allowedRoles: ['admin', 'staff'] },
    ];

    // 3. Lọc danh sách menu dựa trên role của user hiện tại
    const filteredNavItems = navItems.filter(item => item.allowedRoles.includes(currentRole));

    // Hàm để tạo CSS class
    const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
        const baseClasses = "flex items-center p-3 rounded-lg transition-colors duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900";
        const activeClasses = "bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white";

        return isActive ? `${baseClasses} ${activeClasses}` : baseClasses;
    };

    return (
        <div className="w-20 md:w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="flex items-center justify-center md:justify-start md:pl-6 h-20 border-b border-gray-200">
                <ChefHat className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
                <span className="hidden md:block ml-3 text-2xl font-bold text-gray-900">POS Pro</span>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-2">
                {/* 4. Render danh sách đã lọc (filteredNavItems) */}
                {filteredNavItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}                     
                        className={getNavLinkClass} 
                        end={item.path === "/"} 
                    >
                        <item.icon className="w-6 h-6" />
                        <span className="hidden md:block ml-4 font-semibold">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

export default Sidebar;