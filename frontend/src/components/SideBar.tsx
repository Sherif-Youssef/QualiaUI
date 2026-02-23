import { NavLink } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Settings, Database, Users, HelpCircle, ShieldCheck, X } from 'lucide-react';

interface SideBarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SideBar = ({ isOpen, onClose }: SideBarProps) => {
    const navItems = [
        { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
        { name: "Test Suites", path: "/test-suite-manager", icon: <ClipboardList size={20} /> },
        { name: "Projects", path: "/projects", icon: <Database size={20} /> },
        { name: "Organization", path: "/organization", icon: <Users size={20} /> },
    ];

    const bottomItems = [
        { name: "Settings", path: "/settings", icon: <Settings size={20} /> },
        { name: "Support", path: "/support", icon: <HelpCircle size={20} /> },
    ];

    return (
        <aside className={`
            fixed inset-y-0 left-0 z-40 w-72 bg-gray-900 text-gray-400 flex flex-col transition-transform duration-300 ease-in-out transform
            lg:relative lg:translate-x-0
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            {/* Logo Section */}
            <div className="p-8 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-white">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <ShieldCheck className="text-white" size={24} />
                    </div>
                    <span className="text-xl font-black tracking-tight uppercase">Qualia UI</span>
                </div>
                <button
                    onClick={onClose}
                    className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-4 mt-8 space-y-1 overflow-y-auto">
                <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Core Platform</p>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => {
                            if (window.innerWidth < 1024) onClose();
                        }}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                                : 'hover:bg-gray-800 hover:text-white'
                            }`
                        }
                    >
                        <span className="shrink-0">{item.icon}</span>
                        <span className="font-medium">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="px-4 pb-8 space-y-1">
                <div className="h-px bg-gray-800 mx-4 mb-6"></div>
                {bottomItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => {
                            if (window.innerWidth < 1024) onClose();
                        }}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                                : 'hover:bg-gray-800 hover:text-white'
                            }`
                        }
                    >
                        <span className="shrink-0">{item.icon}</span>
                        <span className="font-medium">{item.name}</span>
                    </NavLink>
                ))}
            </div>
        </aside>
    );
};
