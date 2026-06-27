/**
 * @file ProviderList.tsx
 * @description Sidebar list component for selecting LLM Providers.
 * Displays provider details search input, paginated provider items, and action to launch the creation modal.
 */

import React from 'react';
import { Plus, Server, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';
import { Provider, ProviderDisplayNames } from "@/types";

interface ProviderListProps {
    providers: Provider[];
    totalProviders: number;
    providerPage: number;
    onPageChange: (page: number) => void;
    selectedProviderId: number | null;
    onSelectProvider: (id: number) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onNewProvider: () => void;
    isLoading: boolean;
    itemsPerPage: number;
}

export const ProviderList: React.FC<ProviderListProps> = ({
    providers,
    totalProviders,
    providerPage,
    onPageChange,
    selectedProviderId,
    onSelectProvider,
    searchQuery,
    onSearchChange,
    onNewProvider,
    isLoading,
    itemsPerPage,
}) => {
    return (
        <div className="w-full lg:w-96 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-gray-900">Providers</h3>
                <Button
                    size="sm"
                    onClick={onNewProvider}
                    className="bg-primary hover:bg-primary/90 rounded-xl h-9 px-3"
                >
                    <Plus className="w-4 h-4 mr-1.5" />
                    New
                </Button>
            </div>

            <div className="space-y-3 flex-shrink-0">
                <SearchBar
                    value={searchQuery}
                    onChange={onSearchChange}
                    placeholder="Search providers..."
                />
            </div>

            <div className="flex-grow flex flex-col min-h-[400px]">
                {isLoading ? (
                    <div className="flex-grow flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="space-y-2 mb-4">
                        {providers.map(provider => (
                            <button
                                key={provider.id}
                                onClick={() => onSelectProvider(provider.id)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${selectedProviderId === provider.id
                                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                        : 'bg-white border-gray-100 text-gray-900 hover:border-primary/20 hover:shadow-sm'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedProviderId === provider.id ? 'bg-white/20' : 'bg-gray-50 text-gray-400 group-hover:text-primary group-hover:bg-primary/5'
                                        }`}>
                                        <Server className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm truncate max-w-[160px]">{provider.display_name}</p>
                                        <p className={`text-[10px] font-black uppercase tracking-wider ${selectedProviderId === provider.id ? 'text-white/60' : 'text-gray-400'
                                            }`}>
                                            {ProviderDisplayNames[provider.provider_type] || provider.provider_type}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className={`w-4 h-4 transition-transform ${selectedProviderId === provider.id ? 'translate-x-1' : 'text-gray-300'}`} />
                            </button>
                        ))}
                        {providers.length === 0 && (
                            <div className="py-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                <p className="text-gray-400 text-sm font-medium">No results found.</p>
                            </div>
                        )}
                    </div>
                )}

                {totalProviders > itemsPerPage && (
                    <div className="mt-auto pt-4 border-t border-gray-50">
                        <Pagination
                            currentPage={providerPage}
                            totalItems={totalProviders}
                            itemsPerPage={itemsPerPage}
                            totalPages={Math.ceil(totalProviders / itemsPerPage)}
                            onPageChange={onPageChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
