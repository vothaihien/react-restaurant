import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import App from "@/../App";
import LoginView from "@/pages/admin/LoginView";

const AdminApp: React.FC = () => {
  const { isAuthenticated } = useAuth(); 

  if (!isAuthenticated) {
    return <LoginView />;
  }
  return <App />;
};

export default AdminApp;
