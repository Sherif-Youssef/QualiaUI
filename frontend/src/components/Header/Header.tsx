import { Menu } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { useSearch } from '@/hooks/useSearch';
import { SearchBar } from './SearchBar';
import { NotificationSection } from './NotificationSection';
import { UserProfile } from './UserProfile';

interface HeaderProps {
    onMenuClick: () => void;
    onSearch?: (query: string) => void;
}

const Header = ({ onMenuClick, onSearch }: HeaderProps) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSearchMobileOpen, setIsSearchMobileOpen] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchBackageRef = useRef<HTMLDivElement>(null);
    const {
        searchQuery,
        setSearchQuery,
        suggestions,
        showSuggestions,
        setShowSuggestions,
        activeIndex,
        setActiveIndex,
        isLoading,
        error,
        retryFetch
    } = useSearch(onSearch);

    const userData = {
        name: "Ali Mohsen",
        role: "Admin Account",
        initials: "AM"
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };

        if (isProfileOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileOpen]);

    useEffect(() => {
        if (isSearchMobileOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchMobileOpen]);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchBackageRef.current && !searchBackageRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        if (showSuggestions) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSuggestions, setShowSuggestions]);
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        }
        else if (e.key === 'ArrowUp') {
            setActiveIndex(prev => Math.max(prev - 1, -1));
        }
        else if (e.key === 'Enter') {
            if (activeIndex >= 0 && activeIndex < suggestions.length) {
                setSearchQuery(suggestions[activeIndex]);
                setShowSuggestions(false);
            }
        }
        else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setActiveIndex(-1);
        }
    };

    const handleSearchQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    return (
        <header className="relative bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
            <div className="flex justify-between items-center px-4 md:px-8 py-4">
                <div className="flex items-center gap-4 flex-1">
                    {!isSearchMobileOpen && (
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                            <Menu size={24} />
                        </button>
                    )}

                    <SearchBar
                        searchBackageRef={searchBackageRef}
                        searchInputRef={searchInputRef}
                        isSearchMobileOpen={isSearchMobileOpen}
                        setIsSearchMobileOpen={setIsSearchMobileOpen}
                        searchQuery={searchQuery}
                        suggestions={suggestions}
                        showSuggestions={showSuggestions}
                        setShowSuggestions={setShowSuggestions}
                        activeIndex={activeIndex}
                        isLoading={isLoading}
                        error={error}
                        retryFetch={retryFetch}
                        handleKeyDown={handleKeyDown}
                        handleSearchQuery={handleSearchQuery}
                    />
                </div>
                {!isSearchMobileOpen && (
                    <div className="flex items-center gap-1 md:gap-6">
                        <NotificationSection onSearchMobileClick={() => setIsSearchMobileOpen(true)} />

                        <UserProfile
                            dropdownRef={dropdownRef}
                            isProfileOpen={isProfileOpen}
                            setIsProfileOpen={setIsProfileOpen}
                            userData={userData}
                        />
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
