
import React from 'react';
import type { View } from '../types';
import { ChefHatIcon, GridIcon, MenuIcon, ChartIcon, SettingsIcon } from './Icons';

interface SidebarProps {
    currentView: View;
    setCurrentView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
    const navItems = [
        { id: 'dashboard', label: 'Sơ đồ bàn', icon: GridIcon },
        { id: 'menu', label: 'Thực đơn', icon: MenuIcon },
        { id: 'reservations', label: 'Đặt bàn', icon: GridIcon },
        { id: 'inventory', label: 'Kho', icon: MenuIcon },
        { id: 'masterdata', label: 'Danh mục', icon: SettingsIcon },
        { id: 'kds', label: 'Màn hình bếp', icon: ChefHatIcon },
        { id: 'reports', label: 'Báo cáo', icon: ChartIcon },
        { id: 'settings', label: 'Cài đặt', icon: SettingsIcon },
    ];

    return (
        <div className="w-20 md:w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="flex items-center justify-center md:justify-start md:pl-6 h-20 border-b border-gray-200">
                <ChefHatIcon className="w-8 h-8 text-indigo-500" />
                <span className="hidden md:block ml-3 text-2xl font-bold text-gray-900">POS Pro</span>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-2">
                {navItems.map((item) => (
                    <a
                        key={item.id}
                        href="#"
                        onClick={(e) => { e.preventDefault(); setCurrentView(item.id as View); }}
                        className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${currentView === item.id
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                    >
                        <item.icon className="w-6 h-6" />
                        <span className="hidden md:block ml-4 font-semibold">{item.label}</span>
                    </a>
                ))}
            </nav>
        </div>
    );
};

export default Sidebar;
