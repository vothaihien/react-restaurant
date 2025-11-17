import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardView from "./src/views/DashboardView.tsx";
import MenuView from "./src/views/MenuView.tsx";
import ReportsView from "./src/views/ReportsView.tsx";
import SettingsView from "./src/views/SettingsView.tsx";
import type { View } from "@/core/types";
import ReservationsView from "./src/views/ReservationsView.tsx";
import InventoryView from "./src/views/InventoryView.tsx";
import MasterDataView from "./src/views/MasterDataView.tsx";
import KDSView from "./src/views/KDSView.tsx";
import CustomerPortalView from "./src/views/CustomerPortalView.tsx";
import CustomerApp from "./modules/customer/presentation/CustomerApp.tsx";

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
};

export default App;
