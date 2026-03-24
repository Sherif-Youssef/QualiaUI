import React from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { NavLinks } from './NavLinks';

interface MobileMenuProps {
  navLinks: any[];
  isOpen: boolean;
  onToggle: () => void;
  onLogout: () => void;
  innerRef: React.RefObject<HTMLDivElement>;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  navLinks,
  isOpen,
  onToggle,
  onLogout,
  innerRef
}) => {
  return (
    <div className="relative md:hidden" ref={innerRef}>
      <button 
        onClick={onToggle}
        className={`p-2.5 rounded-2xl transition-all ${isOpen ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 font-black'}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden z-[300]">
          <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex flex-col gap-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Navigation</p>
            <h3 className="text-sm font-black text-gray-900 uppercase">Pages</h3>
          </div>
          <div className="p-3">
             <NavLinks 
               links={navLinks} 
               onItemClick={onToggle}
               className="gap-1 flex flex-col"
             />
          </div>
          <div className="p-3 border-t border-gray-50">
            <button 
              onClick={onLogout} 
              className="w-full flex items-center gap-4 px-5 py-5 text-sm font-black text-failure bg-red-50/50 hover:bg-red-50 text-failure/80 rounded-2xl transition-all mt-2 uppercase tracking-tight"
            >
              <div className="p-1.5 rounded-lg bg-white text-failure/40 border border-failure/5">
                <LogOut className="w-4 h-4" />
              </div>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
