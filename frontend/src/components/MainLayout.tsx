import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SideBar } from './SideBar';
import Header from './Header';

export const MainLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <SideBar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header onMenuClick={toggleSidebar} />
                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
            {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
        </div>
    );
};
