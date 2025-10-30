
import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './views/DashboardView';
import MenuView from './views/MenuView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';
import type { View } from './types';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('dashboard');

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardView />;
            case 'menu':
                return <MenuView />;
            case 'reports':
                return <ReportsView />;
            case 'settings':
                return <SettingsView />;
            default:
                return <DashboardView />;
        }
    };

    return (
        <AppProvider>
            <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
                <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-800 p-4 sm:p-6 md:p-8">
                        {renderView()}
                    </main>
                </div>
            </div>
        </AppProvider>
    );
};

export default App;
