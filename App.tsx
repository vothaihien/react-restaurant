import React, { Suspense, lazy } from "react";
import { BrowserRouter, useLocation, Routes, Route } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import AppRoutes from "@/routes/route";

// 1. Import ThemeProvider vừa tạo
import { ThemeProvider } from "@/contexts/ThemeContext";

const CustomerApp = lazy(() => import("@/pages/customer/CustomerApp"));

const MainLayout: React.FC = () => {
  const location = useLocation();
  const noLayoutRoutes = ['/login', '/unauthorized'];
  const isFullScreen = noLayoutRoutes.includes(location.pathname);

  // Layout Full màn hình (Login)
  if (isFullScreen) {
    return (
      // Thêm dark:bg-gray-900 để màn hình Login cũng tối khi bật DarkMode
      <div className="h-screen w-full bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
        <AppRoutes />
      </div>
    );
  }

  // Layout Admin chính
  return (
    // bg-gray-100 -> dark:bg-gray-900 (Nền tổng thể tối)
    // text-gray-900 -> dark:text-gray-100 (Chữ chuyển sang trắng)
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      
      {/* Sidebar đã được xử lý dark mode bên trong nó rồi */}
      <Sidebar currentPath={location.pathname} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header bạn cũng nên kiểm tra xem có hỗ trợ dark mode chưa nhé */}
        <Header />
        
        {/* 3. CẬP NHẬT NỀN CHO KHUNG VIEW CHÍNH */}
        {/* bg-white -> dark:bg-gray-900 (Nền nội dung chính tối) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white dark:bg-gray-900 p-4 sm:p-6 md:p-8 transition-colors duration-300">
          <AppRoutes />
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      {/* 4. BỌC THEME PROVIDER Ở ĐÂY */}
      {/* storageKey là tên key lưu trong localStorage */}
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <Suspense fallback={<div className="flex h-screen items-center justify-center dark:bg-gray-900 dark:text-white">Loading...</div>}>
          <Routes>
            <Route path="/customer" element={<CustomerApp />} />
            <Route path="/customer/:tab" element={<CustomerApp />} />
            <Route path="*" element={<MainLayout />} />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;