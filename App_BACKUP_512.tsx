<<<<<<< HEAD
import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom'; // Thêm BrowserRouter và useLocation
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AppRoutes from 'src/routes/route';


const MainLayout: React.FC = () => {
    const location = useLocation(); 

    return (
        <div className="flex h-screen bg-gray-100 text-gray-900 font-sans">
            <Sidebar currentPath={location.pathname} /> 
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white p-4 sm:p-6 md:p-8">
                    {/* Đây là nơi các Views (Dashboard, Menu, Customer,...) sẽ được hiển thị */}
                    <AppRoutes /> 
                </main>
            </div>
        </div>
    );
}

const App: React.FC = () => {
    // Bao bọc toàn bộ ứng dụng bằng BrowserRouter ở cấp cao nhất
    return (
        <BrowserRouter>
            <MainLayout />
        </BrowserRouter>
    );
=======
import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import type { View } from "@/core/types";
import CustomerApp from "./modules/customer/presentation/CustomerApp.tsx";
import {
  DashboardView,
  MenuView,
  ReservationsView,
  InventoryView,
  MasterDataView,
  EmployeesView,
  KDSView,
  ReportsView,
  SettingsView,
} from "./modules/admin/presentation/views";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>("dashboard");

  // Khi chọn view "customer", hiển thị giao diện website khách hàng full-screen
  if (currentView === "customer") {
    return <CustomerApp />;
  }

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardView />;
      case "menu":
        return <MenuView />;
      case "reservations":
        return <ReservationsView />;
      case "inventory":
        return <InventoryView />;
      case "masterdata":
        return <MasterDataView />;
      case "employees":
        return <EmployeesView />;
      case "kds":
        return <KDSView />;
      case "reports":
        return <ReportsView />;
      case "settings":
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
>>>>>>> 033d2064df1268d554c61aff1ed1698a95cb5005
};

export default App;