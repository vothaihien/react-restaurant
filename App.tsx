import React, { Suspense, lazy } from "react";
import { BrowserRouter, useLocation, Routes, Route } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import AppRoutes from "@/routes/route";

// Lazy load CustomerApp để đảm bảo nó chỉ được load khi cần
const CustomerApp = lazy(() => import("@/pages/customer/CustomerApp"));

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
};

const App: React.FC = () => {
  // Bao bọc toàn bộ ứng dụng bằng BrowserRouter ở cấp cao nhất
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {/* Customer routes - render độc lập, không có Sidebar/Header của admin */}
          {/* Phải đặt trước route catch-all để được match trước */}
          <Route path="/customer" element={<CustomerApp />} />
          <Route path="/customer/:tab" element={<CustomerApp />} />
          
          {/* Các routes khác - render trong MainLayout */}
          <Route path="*" element={<MainLayout />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;

