
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './views/DashboardView';
import MenuView from './views/MenuView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';
import type { View } from '@/core/types';
import ReservationsView from './views/ReservationsView.tsx';
import InventoryView from './views/InventoryView.tsx';
import MasterDataView from './views/MasterDataView.tsx';
import KDSView from './views/KDSView.tsx';
import CustomerPortalView from './views/CustomerPortalView.tsx';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('dashboard');

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardView />;
            case 'menu':
                return <MenuView />;
            case 'reservations':
                return <ReservationsView />;
            case 'inventory':
                return <InventoryView />;
            case 'masterdata':
                return <MasterDataView />;
            case 'kds':
                return <KDSView />;
            case 'customer':
                return <CustomerPortalView />;
            case 'reports':
                return <ReportsView />;
            case 'settings':
                return <SettingsView />;
            default:
                return <DashboardView />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 text-gray-900 font-sans">
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white p-4 sm:p-6 md:p-8">
                    {renderView()}
                </main>
            </div>
        </div>
    );
};

export default App;
