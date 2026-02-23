import { Search, X } from 'lucide-react';
import React from 'react';

interface SearchBarProps {
    searchBackageRef: React.RefObject<any>;
    searchInputRef: React.RefObject<any>;
    isSearchMobileOpen: boolean;
    setIsSearchMobileOpen: (open: boolean) => void;
    searchQuery: string;
    suggestions: string[];
    showSuggestions: boolean;
    setShowSuggestions: (show: boolean) => void;
    activeIndex: number;
    isLoading: boolean;
    error: string | null;
    retryFetch: () => void;
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    handleSearchQuery: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SearchBar = ({ searchBackageRef, searchInputRef, isSearchMobileOpen, setIsSearchMobileOpen, searchQuery, suggestions, showSuggestions, setShowSuggestions, activeIndex, isLoading, error, retryFetch, handleKeyDown, handleSearchQuery }: SearchBarProps) => {
    return (
        <div ref={searchBackageRef} className={`flex-1 max-w-md ${isSearchMobileOpen ? 'flex' : 'hidden md:block'}`}>
            <div className="relative group w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search projects, suites or results..."
                    onChange={handleSearchQuery}
                    onKeyDown={handleKeyDown}
                    onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                    value={searchQuery}
                    className="w-full bg-gray-50 border-transparent border focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 rounded-2xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-400"
                />
                {showSuggestions && (suggestions.length > 0 || error || isLoading) && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-blue-900/10 overflow-hidden z-50">
                        <div className="max-h-80 overflow-y-auto p-1">
                            {isLoading && suggestions.length === 0 && (
                                <div className="p-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    Fetching suggestions...
                                </div>
                            )}

                            {error && (
                                <div className="p-4 text-center mx-1">
                                    <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg mb-2">{error}</p>
                                    <button
                                        onClick={() => retryFetch()}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-700 underline"
                                    >
                                        Try reloading data
                                    </button>
                                </div>
                            )}

                            {!isLoading && !error && suggestions.length === 0 && searchQuery.length >= 2 && (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    No results found for "{searchQuery}"
                                </div>
                            )}

                            {suggestions.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        handleSearchQuery({ target: { value: item } } as any);
                                        setShowSuggestions(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors rounded-xl
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
    );
};