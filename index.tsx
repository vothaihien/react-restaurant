import React from "react";
import ReactDOM from "react-dom/client";
import AdminApp from "@admin/presentation/AdminApp.tsx";
import CustomerApp from "@customer/presentation/CustomerApp.tsx";
import { AppProvider } from "@/core/context/AppContext";
import { FeedbackProvider } from "@/core/context/FeedbackContext";
import { AuthProvider } from "@/core/context/AuthContext.tsx";
import { useUISettings } from "@/shared/hooks/useUISettings";
import "./index.css";

// Component wrapper để áp dụng UI settings
const AppWithUISettings: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useUISettings();
  return <>{children}</>;
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
const path = window.location.pathname;
const isCustomer = path.startsWith("/customer");

root.render(
  <React.StrictMode>
    <AppWithUISettings>
      <FeedbackProvider>
        <AuthProvider>
          <AppProvider>{isCustomer ? <CustomerApp /> : <AdminApp />}</AppProvider>
        </AuthProvider>
      </FeedbackProvider>
    </AppWithUISettings>
  </React.StrictMode>
);
