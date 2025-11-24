import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom'; // Thêm BrowserRouter và useLocation
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AppRoutes from 'src/routes/route';


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
}

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <MainLayout />
        </BrowserRouter>
    );
};

export default App;