import React from 'react';
import CustomerPortalView from '../../../src/views/CustomerPortalView';

const SiteHeader: React.FC<{ onBook?: () => void }> = ({ onBook }) => (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <img src="/vite.svg" className="w-8 h-8" />
                <span className="text-xl font-bold text-gray-900">Nhà hàng Flavor</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-gray-700">
                <a href="#menu" className="hover:text-gray-900">Thực đơn</a>
                <a href="#about" className="hover:text-gray-900">Giới thiệu</a>
                <a href="#contact" className="hover:text-gray-900">Liên hệ</a>
                <span className="text-sm text-gray-500">Hotline: 0909 000 111</span>
                <button onClick={onBook} className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white">Đặt bàn</button>
            </div>
        </div>
    </header>
);

const SiteFooter: React.FC = () => (
    <footer className="mt-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <h4 className="font-semibold text-gray-900">Nhà hàng Flavor</h4>
                <p className="text-gray-600 mt-2">Ẩm thực hiện đại · Nguyên liệu tươi · Không gian ấm cúng.</p>
            </div>
            <div id="contact">
                <h4 className="font-semibold text-gray-900">Liên hệ</h4>
                <p className="text-gray-600 mt-2">Hotline: 0909 000 111</p>
                <p className="text-gray-600">Địa chỉ: 123 Đường Ẩm Thực, Q.1, TP.HCM</p>
                <p className="text-gray-600">Giờ mở cửa: 10:00 - 22:00</p>
            </div>
            <div>
                <h4 className="font-semibold text-gray-900">Kết nối</h4>
                <div className="mt-2 flex gap-3 text-gray-600">
                    <a href="#" className="hover:text-gray-900">Facebook</a>
                    <a href="#" className="hover:text-gray-900">Instagram</a>
                    <a href="#" className="hover:text-gray-900">Zalo</a>
                </div>
            </div>
        </div>
        <div className="text-center text-gray-500 text-sm py-3 border-t border-gray-200">© {new Date().getFullYear()} Flavor Restaurant. All rights reserved.</div>
    </footer>
);

const CustomerApp: React.FC = () => (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <SiteHeader />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-6">
            <CustomerPortalView />
        </main>
        <SiteFooter />
    </div>
);

export default CustomerApp;
