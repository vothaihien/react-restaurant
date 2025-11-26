import React from "react";
import OrderManagement from 'src/pages/admin/OrdersManagement';
import { Routes, Route } from "react-router-dom";
import {
  DashboardView,
  MenuView,
  ReservationsView,
  InventoryView,
  MasterDataView,
  KDSView,
  ReportsView,
  SettingsView,
} from "@/pages/admin";
import CustomerPortalView, {
  CustomerTab,
} from "@/pages/customer/CustomerPortalView";
import InventoryScreen from "@/pages/admin/InventoryScreen";
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardView />} />
      <Route path="/menu" element={<MenuView />} />
      <Route path="/reservations" element={<ReservationsView />} />
      <Route path="/inventory" element={<InventoryScreen />} />
      <Route path="/masterdata" element={<MasterDataView />} />
      <Route path="/orders-management" element={<OrderManagement />} />
      <Route path="/kds" element={<KDSView />} />
      <Route
        path="/customer"
        element={
          <CustomerPortalView
            tab={"home"}
            onTabChange={function (tab: CustomerTab): void {
              throw new Error("Function not implemented.");
            }}
          />
        }
      />
      <Route path="/reports" element={<ReportsView />} />
      <Route path="/settings" element={<SettingsView />} />
      <Route path="*" element={<div>404: Page Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;
