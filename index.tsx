
import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from '@admin/presentation/AdminApp.tsx';
import CustomerApp from '@customer/presentation/CustomerApp.tsx';
import { AppProvider } from './context/AppContext';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
const path = window.location.pathname;
const isCustomer = path.startsWith('/customer');

root.render(
  <React.StrictMode>
    <AppProvider>
      {isCustomer ? <CustomerApp /> : <AdminApp />}
    </AppProvider>
  </React.StrictMode>
);
