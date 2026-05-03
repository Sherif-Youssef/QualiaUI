import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavLinkItem {
  name: string;
  path: string;
  icon?: React.ReactNode;
}

interface NavLinksProps {
  links: NavLinkItem[];
  className?: string;
  onItemClick?: () => void;
}

export const NavLinks: React.FC<NavLinksProps> = ({ links, className, onItemClick }) => {
  return (
    <nav className={className}>
      {links.map((link) => (
        <NavLink
          key={link.path}
          to={link.path}
          onClick={onItemClick}
          className={({ isActive }) => `
            flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
            ${isActive 
              ? 'bg-primary/5 text-primary shadow-sm ring-1 ring-primary/10' 
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
          `}
        >
          {link.icon && link.icon}
          {link.name}
        </NavLink>
      ))}
    </nav>
  );
};
