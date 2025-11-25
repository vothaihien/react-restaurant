import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const Header: React.FC = () => {
    const [time, setTime] = useState(new Date());
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = () => {
        logout();
        setShowDropdown(false);
    };

    return (
        <header className="h-20 flex items-center justify-between px-8 bg-white border-b border-gray-200">
            <div>
                {/* Potentially add search or other actions here */}
            </div>
            <div className="flex items-center gap-6">
                <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                        {time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                    <p className="text-sm text-gray-500">
                        {time.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                
                {user && user.type === 'admin' && (
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
                        >
                            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.tenVaiTro || 'Nhân viên'}</p>
                            </div>
                        </button>
                        
                        {showDropdown && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowDropdown(false)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                                    <div className="p-2">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                                        >
                                            Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;


