/**
 * @file LLMManagement.tsx
 * @description Coordinator container component for LLM Provider and Model administration.
 * It manages state synchronization, fetch actions, modal triggers, and API update operations
 * for providers and models.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { llmService } from '@/services/llmService';
import { Provider, LLMModel } from "@/types";
import { ProviderFormModal } from './ProviderFormModal';
import { ModelFormModal } from './ModelFormModal';
import { DeleteConfirmationModal } from '@/components/Modal/DeleteConfirmationModal';
import { ProviderList } from './ProviderList';
import { ProviderDetail } from './ProviderDetail';

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
            <ProviderList
                providers={providers}
                totalProviders={totalProviders}
                providerPage={providerPage}
                onPageChange={setProviderPage}
                selectedProviderId={selectedProviderId}
                onSelectProvider={setSelectedProviderId}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onNewProvider={() => { setEditingProvider(undefined); setIsProviderModalOpen(true); }}
                isLoading={isLoading}
                itemsPerPage={ITEMS_PER_PAGE}
            />

            <div className="flex-grow flex flex-col min-w-0">
                <ProviderDetail
                    selectedProvider={selectedProvider}
                    models={models}
                    totalModels={totalModels}
                    modelPage={modelPage}
                    onModelPageChange={setModelPage}
                    isModelsLoading={isModelsLoading}
                    onEditProvider={(provider) => { setEditingProvider(provider); setIsProviderModalOpen(true); }}
                    onDeleteProvider={(id, name) => setDeleteConfirmation({ id, type: 'provider', name })}
                    onAddModel={() => { setEditingModel(undefined); setIsModelModalOpen(true); }}
                    onEditModel={(model) => { setEditingModel(model); setIsModelModalOpen(true); }}
                    onDeleteModel={(id, name) => setDeleteConfirmation({ id, type: 'model', name })}
                    itemsPerPage={ITEMS_PER_PAGE}
                />
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
