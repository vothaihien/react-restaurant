import { DashboardView, InventoryView, KDSView, MasterDataView, MenuView, ReportsView, ReservationsView } from '@admin/presentation/views';
import React from 'react';
import { Routes, Route } from 'react-router-dom'; 
import CustomerPortalView from 'src/views/CustomerPortalView';
import SettingsView from 'src/views/SettingsView';
const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<DashboardView />} /> 
            <Route path="/menu" element={<MenuView />} />
            <Route path="/reservations" element={<ReservationsView />} />
            <Route path="/inventory" element={<InventoryView />} /> 
            
            <Route path="/masterdata" element={<MasterDataView />} />
            <Route path="/kds" element={<KDSView />} />
            <Route path="/customer" element={<CustomerPortalView />} /> 
            <Route path="/reports" element={<ReportsView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="*" element={<div>404: Page Not Found</div>} />
        </Routes>
    );
};

export default AppRoutes;