import React from 'react';
import { Routes, Route } from 'react-router-dom'; 
import DashboardView from 'src/views/DashboardView.tsx';
import MenuView from 'src/views/MenuView';
import ReservationsView from 'src/views/ReservationsView';
import MasterDataView from 'src/views/MasterDataView';
import CustomerPortalView from 'src/views/CustomerPortalView';
import KDSView from 'src/views/KDSView'; 
import ReportsView from 'src/views/ReportsView';

import InventoryView from 'src/views/InventoryScreen';
import SettingsView from 'src/views/SettingsView';
const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* Định tuyến Dashboard (trang chủ) */}
            <Route path="/" element={<DashboardView />} /> 
            
            {/* Các Routes khác */}
            <Route path="/menu" element={<MenuView />} />
            <Route path="/reservations" element={<ReservationsView />} />
            
            {/* 💡 SỬA LỖI 2: Đổi từ InventoryService sang InventoryView */}
            <Route path="/inventory" element={<InventoryView />} /> 
            
            <Route path="/masterdata" element={<MasterDataView />} />
            <Route path="/kds" element={<KDSView />} />
            <Route path="/customer" element={<CustomerPortalView />} /> 
            <Route path="/reports" element={<ReportsView />} />
            <Route path="/settings" element={<SettingsView />} />

            {/* Route Catch-all (404 Not Found) */}
            <Route path="*" element={<div>404: Page Not Found</div>} />
        </Routes>
    );
};

export default AppRoutes;