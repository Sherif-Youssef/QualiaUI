import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Server, Cpu, Edit2, Trash2, ShieldCheck, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';
import { llmService } from '@/services/llmService';
import { Provider, LLMModel, ProviderDisplayNames } from "@/types";
import { ProviderFormModal } from './ProviderFormModal';
import { ModelFormModal } from './ModelFormModal';
import { DeleteConfirmationModal } from '@/components/Modal/DeleteConfirmationModal';

const ITEMS_PER_PAGE = 10;

export const LLMManagement: React.FC = () => {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [totalProviders, setTotalProviders] = useState(0);
    const [providerPage, setProviderPage] = useState(1);

    const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
    const [models, setModels] = useState<LLMModel[]>([]);
    const [totalModels, setTotalModels] = useState(0);
    const [modelPage, setModelPage] = useState(1);

    const [isLoading, setIsLoading] = useState(true);
    const [isModelsLoading, setIsModelsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    
    const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<Provider | undefined>();
    const [editingModel, setEditingModel] = useState<LLMModel | undefined>();
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number, type: 'provider' | 'model', name: string } | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    const fetchProviders = useCallback(async () => {
        setIsLoading(true);
        try {
            const offset = (providerPage - 1) * ITEMS_PER_PAGE;
            const res = await llmService.listProviders(
                offset,
                ITEMS_PER_PAGE,
                searchQuery || undefined
            );
            setProviders(res.items);
            setTotalProviders(res.total_items);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [providerPage, searchQuery]);

    const fetchModels = useCallback(async () => {
        if (!selectedProviderId) return;
        setIsModelsLoading(true);
        try {
            const offset = (modelPage - 1) * ITEMS_PER_PAGE;
            const res = await llmService.listModels(offset, ITEMS_PER_PAGE, undefined, selectedProviderId);
            setModels(res.items);
            setTotalModels(res.total_items);
        } catch (err) {
            console.error(err);
        } finally {
            setIsModelsLoading(false);
        }
    }, [selectedProviderId, modelPage]);

    useEffect(() => {
        fetchProviders();
    }, [fetchProviders]);

    useEffect(() => {
        fetchModels();
    }, [fetchModels]);

    
    useEffect(() => {
        setProviderPage(1);
    }, [searchQuery]);

    useEffect(() => {
        setModelPage(1);
    }, [selectedProviderId]);

    const handleAddProvider = async (data: any) => {
        setModalLoading(true);
        setModalError(null);
        try {
            const newProvider = await llmService.createProvider(data);
            setIsProviderModalOpen(false);
            await fetchProviders();
            setSelectedProviderId(newProvider.id);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to create provider');
        } finally {
            setModalLoading(false);
        }
    };

    const handleUpdateProvider = async (id: number, data: any) => {
        setModalLoading(true);
        setModalError(null);
        try {
            await llmService.updateProvider(id, data);
            setIsProviderModalOpen(false);
            setEditingProvider(undefined);
            fetchProviders();
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to update provider');
        } finally {
            setModalLoading(false);
        }
    };

    const handleAddModel = async (data: any) => {
        setModalLoading(true);
        setModalError(null);
        try {
            await llmService.createModel(data);
            setIsModelModalOpen(false);
            fetchModels();
            
            fetchProviders();
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to create model');
        } finally {
            setModalLoading(false);
        }
    };

    const handleUpdateModel = async (id: number, data: any) => {
        setModalLoading(true);
        setModalError(null);
        try {
            await llmService.updateModel(id, data);
            setIsModelModalOpen(false);
            setEditingModel(undefined);
            fetchModels();
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to update model');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirmation) return;
        setModalLoading(true);
        try {
            if (deleteConfirmation.type === 'provider') {
                await llmService.deleteProvider(deleteConfirmation.id);
                if (selectedProviderId === deleteConfirmation.id) setSelectedProviderId(null);
                fetchProviders();
            } else {
                await llmService.deleteModel(deleteConfirmation.id);
                fetchModels();
                fetchProviders();
            }
            setDeleteConfirmation(null);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to delete item');
        } finally {
            setModalLoading(false);
        }
    };

    const selectedProvider = providers.find(p => p.id === selectedProviderId);

    return (
        <div className="flex flex-col lg:flex-row gap-8 min-h-[700px]">
            <div className="w-full lg:w-96 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-gray-900">Providers</h3>
                    <Button
                        size="sm"
                        onClick={() => { setEditingProvider(undefined); setIsProviderModalOpen(true); }}
                        className="bg-primary hover:bg-primary/90 rounded-xl h-9 px-3"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        New
                    </Button>
                </div>

                <div className="space-y-3 flex-shrink-0">
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
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
                                    onClick={() => setSelectedProviderId(provider.id)}
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

                    {totalProviders > ITEMS_PER_PAGE && (
                        <div className="mt-auto pt-4 border-t border-gray-50">
                            <Pagination
                                currentPage={providerPage}
                                totalItems={totalProviders}
                                itemsPerPage={ITEMS_PER_PAGE}
                                totalPages={Math.ceil(totalProviders / ITEMS_PER_PAGE)}
                                onPageChange={setProviderPage}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-grow flex flex-col min-w-0">
                {selectedProvider ? (
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-primary shadow-sm">
                                    <Server className="w-8 h-8" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl font-black text-gray-900">{selectedProvider.display_name}</h2>
                                        <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                                            {ProviderDisplayNames[selectedProvider.provider_type]}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 font-medium text-sm mt-1">
                                        {selectedProvider.base_url || 'Default API Endpoint'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => { setEditingProvider(selectedProvider); setIsProviderModalOpen(true); }}
                                    className="bg-white border-gray-100 text-gray-600 hover:text-primary"
                                >
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit Provider
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => setDeleteConfirmation({ id: selectedProvider.id, type: 'provider', name: selectedProvider.display_name })}
                                    className="bg-white border-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                            </div>
                        </div>

                        <div className="flex-grow flex flex-col p-8 gap-6 overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                                        <Cpu className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Available Models</h3>
                                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {totalModels}
                                    </span>
                                </div>
                                <Button
                                    onClick={() => { setEditingModel(undefined); setIsModelModalOpen(true); }}
                                    className="bg-primary hover:bg-primary/90 rounded-xl"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Model
                                </Button>
                            </div>

                            <div className="flex-grow flex flex-col overflow-hidden">
                                {isModelsLoading ? (
                                    <div className="flex-grow flex items-center justify-center">
                                        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 mb-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {models.map(model => (
                                                    <div key={model.id} className="p-5 rounded-3xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-primary/20 transition-all group">
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-1">
                                                                <p className="font-black text-gray-900">{model.display_name}</p>
                                                                <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">{model.model_name}</p>
                                                            </div>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => { setEditingModel(model); setIsModelModalOpen(true); }}
                                                                    className="p-2 hover:bg-primary/5 rounded-lg text-gray-400 hover:text-primary transition-all"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteConfirmation({ id: model.id, type: 'model', name: model.display_name })}
                                                                    className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {models.length === 0 && (
                                                    <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50/30">
                                                        <Cpu className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                                        <p className="text-gray-400 font-bold">No models configured for this provider.</p>
                                                        <p className="text-xs text-gray-400 mt-1">Add a model to start using this provider in your projects.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {totalModels > ITEMS_PER_PAGE && (
                                            <div className="pt-4 border-t border-gray-50 mt-auto">
                                                <Pagination
                                                    currentPage={modelPage}
                                                    totalItems={totalModels}
                                                    itemsPerPage={ITEMS_PER_PAGE}
                                                    totalPages={Math.ceil(totalModels / ITEMS_PER_PAGE)}
                                                    onPageChange={setModelPage}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-50 flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className={`w-4 h-4 ${selectedProvider.has_api_key ? 'text-emerald-500' : 'text-gray-300'}`} />
                                API Credentials: {selectedProvider.has_api_key ? 'Valid Configuration' : 'None Provided'}
                            </div>
                            <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4 text-gray-300" />
                                Identifier: #{selectedProvider.id}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-gray-100 border-dashed border-2">
                        <div className="w-20 h-20 rounded-[2rem] bg-gray-50 flex items-center justify-center text-gray-200 mb-6">
                            <Server className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900">Select a Provider</h3>
                        <p className="text-gray-400 font-medium max-w-xs text-center mt-2">
                            Choose an LLM provider from the list to manage its models and credentials.
                        </p>
                    </div>
                )}
            </div>

            <ProviderFormModal
                isOpen={isProviderModalOpen}
                onClose={() => setIsProviderModalOpen(false)}
                onAdd={handleAddProvider}
                editingProvider={editingProvider}
                onEdit={handleUpdateProvider}
                error={modalError}
                onClearError={() => setModalError(null)}
                isLoading={modalLoading}
            />

            <ModelFormModal
                isOpen={isModelModalOpen}
                onClose={() => setIsModelModalOpen(false)}
                onAdd={handleAddModel}
                editingModel={editingModel}
                onEdit={handleUpdateModel}
                providers={providers}
                error={modalError}
                onClearError={() => setModalError(null)}
                isLoading={modalLoading}
            />

            <DeleteConfirmationModal
                isOpen={deleteConfirmation !== null}
                onClose={() => setDeleteConfirmation(null)}
                onConfirm={handleDelete}
                itemName={deleteConfirmation?.name}
                error={modalError}
                onClearError={() => setModalError(null)}
                isLoading={modalLoading}
            />
        </div>
    );
};
