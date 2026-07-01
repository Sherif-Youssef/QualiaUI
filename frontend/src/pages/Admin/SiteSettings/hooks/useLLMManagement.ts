import { useState, useEffect, useCallback } from 'react';
import { llmService } from '@/services/llmService';
import { Provider, LLMModel, LLMModelCreate, LLMModelUpdate, ProviderCreate, ProviderUpdate } from "@/types";

const ITEMS_PER_PAGE = 10;

export const useLLMManagement = () => {
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
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

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
                debouncedSearch || undefined
            );
            setProviders(res.items);
            setTotalProviders(res.total_items);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [providerPage, debouncedSearch]);

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
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setProviderPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setModelPage(1);
    }, [selectedProviderId]);

    const handleAddProvider = async (data: ProviderCreate) => {
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

    const handleUpdateProvider = async (id: number, data: ProviderUpdate) => {
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

    const handleAddModel = async (data: LLMModelCreate) => {
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

    const handleUpdateModel = async (id: number, data: LLMModelUpdate) => {
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

    const handleRevealApiKey = async (providerId: number): Promise<string | null> => {
        return await llmService.getProviderApiKey(providerId);
    };

    const handleUpdateApiKey = async (providerId: number, newKey: string): Promise<void> => {
        await llmService.updateProviderApiKey(providerId, newKey);
    };

    const selectedProvider = providers.find(p => p.id === selectedProviderId);

    return {
        providers,
        totalProviders,
        providerPage, setProviderPage,
        selectedProviderId, setSelectedProviderId,
        models,
        totalModels,
        modelPage, setModelPage,
        isLoading,
        isModelsLoading,
        searchQuery, setSearchQuery,
        isProviderModalOpen, setIsProviderModalOpen,
        isModelModalOpen, setIsModelModalOpen,
        editingProvider, setEditingProvider,
        editingModel, setEditingModel,
        deleteConfirmation, setDeleteConfirmation,
        modalLoading,
        modalError, setModalError,
        selectedProvider,
        handleAddProvider,
        handleUpdateProvider,
        handleAddModel,
        handleUpdateModel,
        handleDelete,
        handleRevealApiKey,
        handleUpdateApiKey,
        ITEMS_PER_PAGE
    };
};
