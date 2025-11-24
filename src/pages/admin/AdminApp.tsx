import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import App from "@/../App";
import LoginView from "@/pages/admin/LoginView";

const AdminApp: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  // Nếu chưa đăng nhập hoặc không phải admin, hiển thị màn hình đăng nhập
  if (!isAuthenticated || !isAdmin) {
    return <LoginView />;
  }

  return <App />;
};

export default AdminApp;
