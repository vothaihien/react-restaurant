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
  EmployeesView,
  LoginView,
} from "@/pages/admin";
import CustomerPortalView, { CustomerTab } from "@/pages/customer/CustomerPortalView";
import InventoryScreen from "@/pages/admin/InventoryView"; 
import ProtectedRoute from "./ProtectedRoute";
import UnauthorizedView from "@/pages/admin/UnauthorizedView";


const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes (Ai cũng vào được) */}
      <Route path="/login" element={<LoginView />} />
      <Route path="/unauthorized" element={<UnauthorizedView />} />
      <Route path="*" element={<div>404: Page Not Found</div>} />

      {/* --- NHÓM 1: ADMIN & STAFF (Cả 2 đều vào được) --- */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'staff']} />}>
        <Route path="/" element={<DashboardView />} />
        <Route path="/menu" element={<MenuView />} />
        <Route path="/reservations" element={<ReservationsView />} />
        <Route path="/kds" element={<KDSView />} />
        <Route
            path="/customer"
            element={
              <CustomerPortalView
                tab={"home"}
                onTabChange={() => {}}
              />
            }
          />
      </Route>

      {/* --- NHÓM 2: CHỈ ADMIN MỚI ĐƯỢC VÀO --- */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/inventory" element={<InventoryScreen />} />
        <Route path="/masterdata" element={<MasterDataView />} />
        <Route path="/employees" element={<EmployeesView />} />
        <Route path="/reports" element={<ReportsView />} />
        <Route path="/settings" element={<SettingsView />} />
      </Route>

    </Routes>
  );
};

export default AppRoutes;