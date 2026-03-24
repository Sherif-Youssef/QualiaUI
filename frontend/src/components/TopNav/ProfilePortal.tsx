import React from 'react';
import { NavLink } from 'react-router-dom';
import { User as UserIcon, LogOut, Settings, ChevronDown } from 'lucide-react';

interface ProfilePortalProps {
  userName: string;
  role: string;
  isOpen: boolean;
  onToggle: () => void;
  onLogout: () => void;
  innerRef: React.RefObject<HTMLDivElement>;
}

export const ProfilePortal: React.FC<ProfilePortalProps> = ({
  userName,
  role,
  isOpen,
  onToggle,
  onLogout,
  innerRef
}) => {
  return (
    <div className="relative" ref={innerRef}>
      <button
        onClick={onToggle}
        className={`flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-2xl hover:bg-gray-100/50 transition-all ${isOpen ? 'bg-gray-50' : ''}`}
      >
        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200">
          <UserIcon className="w-5 h-5 text-gray-500" />
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-sm font-black text-gray-900 leading-none">{userName}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">{role}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white rounded-[2rem] border border-gray-100 shadow-2xl overflow-hidden z-[200]">
          <div className="p-5 bg-gray-50/50 border-b border-gray-100">
            <p className="text-sm font-black text-gray-900 truncate">Profile Settings</p>
          </div>
          <div className="p-2">
            <NavLink
              to="/profile"
              onClick={onToggle}
              className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-primary rounded-2xl transition-all"
            >
              <Settings className="w-4 h-4" />
              My Profile
            </NavLink>
          </div>
          <div className="p-2 border-t border-gray-50">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-failure/70 hover:bg-failure/5 rounded-2xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
