import React from 'react';
// 💡 Import NavLink từ react-router-dom để điều hướng và highlight
import { NavLink } from 'react-router-dom'; 

import { ChefHatIcon, GridIcon, MenuIcon, ChartIcon, SettingsIcon } from '@/components/Icons';
import { UserIcon } from 'lucide-react';

interface SidebarProps { 
    currentPath: string; // Chấp nhận prop mới
}

// Component Sidebar không cần nhận props điều hướng nữa
const Sidebar: React.FC<SidebarProps> = ({currentPath}) => { 
    // Thay đổi id thành path (đường dẫn URL)
    const navItems = [
        { path: '/', label: 'Sơ đồ bàn', icon: GridIcon }, // / sẽ khớp với DashboardView
        { path: '/menu', label: 'Thực đơn', icon: MenuIcon },
        { path: '/reservations', label: 'Đặt bàn', icon: GridIcon },
        { path: '/inventory', label: 'Kho', icon: MenuIcon },
        { path: '/masterdata', label: 'Danh mục', icon: SettingsIcon },
        { path: '/kds', label: 'Màn hình bếp', icon: ChefHatIcon },
        { path: '/reports', label: 'Báo cáo', icon: ChartIcon },
        { path: '/settings', label: 'Cài đặt', icon: SettingsIcon },
        { path: '/customer', label: 'Cổng Khách hàng', icon: UserIcon }, 
    ];

    // Hàm để tạo CSS class dựa trên trạng thái active của NavLink
    const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
        const baseClasses = "flex items-center p-3 rounded-lg transition-colors duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900";
        const activeClasses = "bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white";

        return isActive ? `${baseClasses} ${activeClasses}` : baseClasses;
    };


    return (
        <div className="w-20 md:w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="flex items-center justify-center md:justify-start md:pl-6 h-20 border-b border-gray-200">
                <ChefHatIcon className="w-8 h-8 text-indigo-500" />
                <span className="hidden md:block ml-3 text-2xl font-bold text-gray-900">POS Pro</span>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-2">
                {navItems.map((item) => (
                    // 💡 Thay thế thẻ <a> bằng NavLink
                    <NavLink
                        key={item.path}
                        to={item.path} // Định nghĩa đường dẫn đích
                        // Sử dụng hàm getNavLinkClass để tự động kiểm tra isActive
                        className={getNavLinkClass} 
                        // Dùng end cho đường dẫn gốc ("/") để nó không highlight luôn các route khác (như /menu)
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