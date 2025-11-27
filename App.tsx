import React, { Suspense, lazy } from "react";
import { BrowserRouter, useLocation, Routes, Route } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import AppRoutes from "@/routes/route";

// Lazy load CustomerApp để đảm bảo nó chỉ được load khi cần
const CustomerApp = lazy(() => import("@/pages/customer/CustomerApp"));

const MainLayout: React.FC = () => {
  const location = useLocation();

  // DANH SÁCH CÁC TRANG FULL MÀN HÌNH (KHÔNG CẦN SIDEBAR/HEADER)
  const noLayoutRoutes = ['/login', '/unauthorized'];
  const isFullScreen = noLayoutRoutes.includes(location.pathname);

  // 1. Nếu là trang Login -> Render full màn hình, không có Sidebar
  if (isFullScreen) {
    return (
      <div className="h-screen w-full bg-gray-100">
        <AppRoutes />
      </div>
    );
  }

  // 2. Nếu là trang Admin bình thường -> Render có Sidebar + Header
  return (
    <div className="flex h-screen bg-gray-100 text-gray-900 font-sans">
      <Sidebar currentPath={location.pathname} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white p-4 sm:p-6 md:p-8">
          {/* Đây là nơi các Views (Dashboard, Menu,...) sẽ được hiển thị */}
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
      <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
        <Routes>
          {/* Customer routes - render độc lập, không đi qua MainLayout */}
          <Route path="/customer" element={<CustomerApp />} />
          <Route path="/customer/:tab" element={<CustomerApp />} />
          
          {/* Tất cả các routes còn lại (Admin, Login...) - đi qua MainLayout để xử lý */}
          <Route path="*" element={<MainLayout />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;