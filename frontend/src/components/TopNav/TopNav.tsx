import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Users } from 'lucide-react';
import { authService } from '@/services/auth/auth';
import { notificationService } from '@/services/notifications/notificationService';
import { NotificationViewModel } from '@/types/notification';

import { Brand } from './Brand';
import { NavLinks } from './NavLinks';
import { NotificationHub } from './NotificationHub';
import { ProfilePortal } from './ProfilePortal';
import { MobileMenu } from './MobileMenu';

export const TopNav: React.FC = () => {
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [userName, setUserName] = useState<string>('Loading...');
  const [role, setRole] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [notifications, setNotifications] = useState<NotificationViewModel[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
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

        const data = await notificationService.getLatestNotifications();

        setNotifications(data);
      } catch (err) {
        console.error("Error fetching nav data:", err);
        setUserName('Guest User');
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const isAnyMenuOpen = isProfileOpen || isNotificationsOpen || isMobileMenuOpen;
    document.body.style.overflow = isAnyMenuOpen ? 'hidden' : '';
  }, [isProfileOpen, isNotificationsOpen, isMobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) setIsProfileOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(target)) setIsNotificationsOpen(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) setIsMobileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleMarkAllRead = async () => {
    const success = await notificationService.markAllAsRead();
    if (success) {
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    }
  };

  const navLinks = [
    { name: 'Projects Portal', path: '/projects', icon: <Database className="w-4 h-4" /> },
  ];
  if (isAdmin) {
    navLinks.push({ name: 'User Management', path: '/admin/users', icon: <Users className="w-4 h-4" /> });
  }

  return (
    <header className="sticky top-0 z-[40] w-full border-b border-gray-100 bg-white/80 backdrop-blur-xl h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Brand />
            <NavLinks links={navLinks} className="hidden md:flex items-center gap-1" />
          </div>

          <div className="flex items-center gap-2 sm:gap-4 h-full relative">
            <NotificationHub
              notifications={notifications}
              isOpen={isNotificationsOpen}
              onToggle={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileOpen(false); setIsMobileMenuOpen(false); }}
              onMarkAllRead={handleMarkAllRead}
              innerRef={notificationRef}
            />

            <ProfilePortal
              userName={userName}
              role={role}
              isOpen={isProfileOpen}
              onToggle={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationsOpen(false); setIsMobileMenuOpen(false); }}
              onLogout={handleLogout}
              innerRef={dropdownRef}
            />

            <MobileMenu
              navLinks={navLinks}
              isOpen={isMobileMenuOpen}
              onToggle={() => { setIsMobileMenuOpen(!isMobileMenuOpen); setIsNotificationsOpen(false); setIsProfileOpen(false); }}
              onLogout={handleLogout}
              innerRef={mobileMenuRef}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
