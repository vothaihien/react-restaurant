import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider } from "@/contexts/AppContext";
import { FeedbackProvider } from "@/contexts/FeedbackContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useUISettings } from "@/hooks/useUISettings";
import "./index.css";

// Component wrapper d? �p d?ng UI settings
const AppWithUISettings: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useUISettings();
  return <>{children}</>;
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Render App component (đã có BrowserRouter bên trong)
root.render(
  <React.StrictMode>
    <AppWithUISettings>
      <FeedbackProvider>
        <AuthProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </AuthProvider>
      </FeedbackProvider>
    </AppWithUISettings>
  </React.StrictMode>
);

