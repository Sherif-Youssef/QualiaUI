import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const Brand: React.FC = () => {
  return (
    <NavLink to="/projects" className="flex items-center gap-3 active:scale-95 group transition-transform">
      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
        <ShieldCheck className="w-6 h-6" />
      </div>
      <span className="text-xl font-sans font-black tracking-tighter text-gray-900 uppercase">Qualia</span>
    </NavLink>
  );
};
