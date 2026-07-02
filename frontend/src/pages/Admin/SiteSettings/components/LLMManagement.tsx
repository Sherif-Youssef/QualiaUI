import React from 'react';
import { ProviderFormModal } from '@/components/Modal/ProviderFormModal';
import { ModelFormModal } from '@/components/Modal/ModelFormModal';
import { DeleteConfirmationModal } from '@/components/Modal/DeleteConfirmationModal';
import { ProviderList } from './ProviderList';
import { ProviderDetail } from './ProviderDetail';
import { useLLMManagement } from '../hooks/useLLMManagement';

export const LLMManagement: React.FC = () => {
    const {
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
    } = useLLMManagement();

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
                onRevealApiKey={handleRevealApiKey}
                onUpdateApiKey={handleUpdateApiKey}
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
