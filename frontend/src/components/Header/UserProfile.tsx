import { ChevronDown, LogOut, Settings } from 'lucide-react';

interface UserProfileProps {
    dropdownRef: any;
    isProfileOpen: boolean;
    setIsProfileOpen: (open: boolean) => void;
    userData: {
        name: string;
        role: string;
        initials: string;
    };
}

export const UserProfile = ({ dropdownRef, isProfileOpen, setIsProfileOpen, userData }: UserProfileProps) => {
    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 md:gap-3 p-1.5 hover:bg-gray-50 rounded-2xl transition-all"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
            >
                <div className="w-8 h-8 md:w-9 md:h-9 bg-blue-600 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-100 text-xs md:text-base">
                    {userData.initials}
                </div>
                <div className="hidden lg:block text-left">
                    <p className="text-sm font-bold text-gray-900 leading-none">{userData.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{userData.role}</p>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 p-2 z-[1000] animate-in fade-in zoom-in duration-200">
                    <button className="w-full flex items-center gap-3 p-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all">
                        <Settings size={16} />
                        Profile Settings
                    </button>
                    <div className="h-px bg-gray-50 my-2 mx-1"></div>
                    <button className="w-full flex items-center gap-3 p-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all">
                        <LogOut size={16} />
                        Log out
                    </button>
                </div>
            )}
        </div>
    );
};
