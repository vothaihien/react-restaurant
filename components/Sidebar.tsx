import React from 'react';
import type { View } from '@/core/types';
import { useAuth } from '@/core/context/AuthContext';
import {
  LayoutGrid,
  Menu,
  Calendar,
  Package,
  Database,
  Users,
  ChefHat,
  BarChart3,
  Settings,
} from 'lucide-react';

interface SidebarProps {
    currentView: View;
    setCurrentView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
    const { user } = useAuth();
    const isManager = user?.type === "admin" && user?.maVaiTro === "VT001";

    const navItems = [
        { id: 'dashboard', label: 'Sơ đồ bàn', icon: LayoutGrid },
        { id: 'menu', label: 'Thực đơn', icon: Menu },
        { id: 'reservations', label: 'Đặt bàn', icon: Calendar },
        { id: 'inventory', label: 'Kho', icon: Package },
        { id: 'masterdata', label: 'Danh mục', icon: Database },
        ...(isManager ? [{ id: 'employees' as View, label: 'Nhân viên', icon: Users }] : []),
        { id: 'kds', label: 'Màn hình bếp', icon: ChefHat },
        { id: 'reports', label: 'Báo cáo', icon: BarChart3 },
        { id: 'settings', label: 'Cài đặt', icon: Settings },
    ];

    return (
        <div className="w-20 md:w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="flex items-center justify-center md:justify-start md:pl-6 h-20 border-b border-gray-200">
                <ChefHat className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
                <span className="hidden md:block ml-3 text-2xl font-bold text-gray-900">POS Pro</span>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-2">
                {navItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                        <a
                            key={item.id}
                            href="#"
                            onClick={(e) => { e.preventDefault(); setCurrentView(item.id as View); }}
                            className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                                currentView === item.id
                                    ? 'text-white'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                            style={currentView === item.id ? { backgroundColor: 'hsl(var(--primary))' } : {}}
                        >
                            <IconComponent className="w-6 h-6" />
                            <span className="hidden md:block ml-4 font-semibold">{item.label}</span>
                        </a>
                    );
                })}
            </nav>
        </div>
    );
};

export default Sidebar;
