import { Search, Bell, HelpCircle, ChevronDown, User, LogOut, Settings, Menu, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

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

    // for seach bar suggestions 
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    //data
    const [allData, setAllData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // handle profile collection
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

    // handles search in small width
    useEffect(() => {
        if (isSearchMobileOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchMobileOpen]);

    // fetching mock data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('https://jsonplaceholder.typicode.com/posts');
                const data = await response.json();
                setAllData(data);
            }
            catch (error) {
                console.log(error);
            }
            finally {
                setIsLoading(false);
            }

        }
        fetchData();
    }, [])
    // handling search query 
    useEffect(() => {
        const handler = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                const filtered = allData
                    .filter((item: any) => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((item: any) => item.title)
                    .slice(0, 8);
                setSuggestions(filtered);
                setShowSuggestions(true);
            }
            else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
            setActiveIndex(-1);
            if (onSearch)
                onSearch(searchQuery);
        }, 300);
        return () => {
            clearTimeout(handler);
        }
    }, [searchQuery, onSearch, allData]);

    // handles click outside backage 
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
    }, [showSuggestions]);

    // handles keydown for suggestions
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
    }

    const handleSearchQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }
    return (
        <header className="relative bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
            <div className="flex justify-between items-center px-4 md:px-8 py-4">
                <div className="flex items-center gap-4 flex-1">
                    {!isSearchMobileOpen && (
                        <button onClick={onMenuClick} className="lg:hidden p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                            <Menu size={24} />
                        </button>
                    )}

                    <div ref={searchBackageRef} className={`flex-1 max-w-md ${isSearchMobileOpen ? 'flex' : 'hidden md:block'}`}>
                        <div className="relative group w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input ref={searchInputRef} type="text" placeholder="Search projects, suites or results..."
                                onChange={handleSearchQuery}
                                onKeyDown={handleKeyDown}
                                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                                value={searchQuery}
                                className="w-full bg-gray-50 border-transparent border focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 rounded-2xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-400" />

                            {/* Suggestions Dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-blue-900/10 overflow-hidden z-50">
                                    <div className="max-h-80 overflow-y-auto">
                                        {suggestions.map((item, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    setSearchQuery(item);
                                                    setShowSuggestions(false);
                                                }}
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors
                                                    ${index === activeIndex ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                <Search size={14} className="text-gray-300" />
                                                <span className="flex-1 font-medium truncate">{item}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isSearchMobileOpen && (
                                <button onClick={() => setIsSearchMobileOpen(false)} className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600">
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {!isSearchMobileOpen && (
                    <div className="flex items-center gap-1 md:gap-6">
                        <div className="flex items-center gap-0.5 md:gap-2 border-r border-gray-100 pr-1 md:pr-6 mr-1 md:mr-2">
                            <button onClick={() => setIsSearchMobileOpen(true)} className="md:hidden p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                <Search size={20} />
                            </button>
                            <button className="flex p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative">
                                <Bell size={20} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                            </button>
                            <button className="hidden sm:flex p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                <HelpCircle size={20} />
                            </button>
                        </div>

                        <div className="relative" ref={dropdownRef}>
                            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 md:gap-3 p-1.5 hover:bg-gray-50 rounded-2xl transition-all">
                                <div className="w-8 h-8 md:w-9 md:h-9 bg-blue-600 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-100 text-xs md:text-base">
                                    AM
                                </div>
                                <div className="hidden lg:block text-left">
                                    <p className="text-sm font-bold text-gray-900 leading-none">Ali Mohsen</p>
                                    <p className="text-xs text-gray-500 mt-1">Admin Account</p>
                                </div>
                                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 p-2 z-50 animate-in fade-in zoom-in duration-200">
                                    <button className="w-full flex items-center gap-3 p-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all">
                                        <User size={16} />
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
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
