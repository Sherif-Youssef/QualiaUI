import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth/auth';

import { Brand } from './Brand';
import { NavLinks } from './NavLinks';
import { ProfilePortal } from './ProfilePortal';
import { MobileMenu } from './MobileMenu';

export const TopNav: React.FC = () => {
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [userName, setUserName] = useState<string>('Loading...');
  const [role, setRole] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await authService.getCurrentUser();
        setUserName(`${user.first_name || ''} ${user.last_name || ''}`);

        const isUserAdmin = user.is_admin || user.role === 'admin';
        const userRole = user.role || 'viewer';

        setRole(userRole.charAt(0).toUpperCase() + userRole.slice(1));
        setIsAdmin(isUserAdmin);
      } catch (err) {
        setUserName('Guest User');
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const isAnyMenuOpen = isProfileOpen || isMobileMenuOpen;
    document.body.style.overflow = isAnyMenuOpen ? 'hidden' : '';
  }, [isProfileOpen, isMobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) setIsProfileOpen(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) setIsMobileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navLinks = [
    { name: 'Projects Portal', path: '/projects' },
  ];
  if (isAdmin) {
    navLinks.push({ name: 'User Management', path: '/admin/users' });
    navLinks.push({ name: 'Site Settings', path: '/admin/settings' });
  }

  return (
    <header className="sticky top-0 z-[40] w-full border-b border-gray-100 bg-white/80 backdrop-blur-xl h-16">
      <div className="px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Brand />
            <NavLinks links={navLinks} className="hidden md:flex items-center gap-1" />
          </div>

          <div className="flex items-center gap-2 sm:gap-4 h-full relative">
            <ProfilePortal
              userName={userName}
              role={role}
              isOpen={isProfileOpen}
              onToggle={() => { setIsProfileOpen(!isProfileOpen); setIsMobileMenuOpen(false); }}
              onLogout={handleLogout}
              innerRef={dropdownRef}
            />

            <MobileMenu
              navLinks={navLinks}
              isOpen={isMobileMenuOpen}
              onToggle={() => { setIsMobileMenuOpen(!isMobileMenuOpen); setIsProfileOpen(false); }}
              onLogout={handleLogout}
              innerRef={mobileMenuRef}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
