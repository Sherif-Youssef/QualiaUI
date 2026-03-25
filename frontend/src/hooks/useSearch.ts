import { useState, useEffect, useCallback } from 'react';

export const useSearch = (onSearch: ((query: string) => void) | undefined) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [allData, setAllData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (signal?: AbortSignal) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/posts', { signal });
            if (!response.ok) throw new Error("Failed to fetch suggestions");
            const data = await response.json();
            setAllData(data);
        }
        catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error('Search fetch error:', err);
            setError(err.message || "An unexpected error occurred while loading search data");
            setSuggestions([]);
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    useEffect(() => {
        const controller = new AbortController();
        fetchData(controller.signal);
        return () => controller.abort();
    }, [fetchData]);
    useEffect(() => {
        const handler = setTimeout(() => {
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

            if (onSearch) {
                onSearch(searchQuery);
            }
        }, 300);

        return () => clearTimeout(handler);
    }, [searchQuery, onSearch, allData]);

    return {
        searchQuery,
        setSearchQuery,
        suggestions,
        showSuggestions,
        setShowSuggestions,
        activeIndex,
        setActiveIndex,
        isLoading,
        error,
        retryFetch: () => fetchData()
    };
};