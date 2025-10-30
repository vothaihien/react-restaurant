
import React from 'react';
import type { View } from '../types';
import { ChefHatIcon, GridIcon, MenuIcon, ChartIcon, SettingsIcon } from './Icons';

interface SidebarProps {
    currentView: View;
    setCurrentView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: GridIcon },
        { id: 'menu', label: 'Menu', icon: MenuIcon },
        { id: 'reports', label: 'Reports', icon: ChartIcon },
        { id: 'settings', label: 'Settings', icon: SettingsIcon },
    ];

    return (
        <div className="w-20 md:w-64 bg-gray-900 border-r border-gray-700 flex flex-col">
            <div className="flex items-center justify-center md:justify-start md:pl-6 h-20 border-b border-gray-700">
                <ChefHatIcon className="w-8 h-8 text-indigo-400"/>
                <span className="hidden md:block ml-3 text-2xl font-bold text-white">POS Pro</span>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-2">
                {navItems.map((item) => (
                    <a
                        key={item.id}
                        href="#"
                        onClick={(e) => { e.preventDefault(); setCurrentView(item.id as View); }}
                        className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                            currentView === item.id
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
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
