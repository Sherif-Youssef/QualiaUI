import React from 'react';
import { NavLink } from 'react-router-dom';

export const Brand: React.FC = () => {
  return (
    <NavLink to="/projects" className="flex items-center gap-3 active:scale-95 group transition-transform">
      <span className="text-xl font-sans font-black tracking-tighter text-gray-900 uppercase">Qualia</span>
    </NavLink>
  );
};
