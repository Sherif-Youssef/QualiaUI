/**
 * @file ProviderDetail.tsx
 * @description Main display component for details of a selected LLM Provider.
 * Shows endpoint configuration, credentials info, list of associated models, edit/delete actions,
 * and a paginated model list representation.
 */

import React from 'react';
import { Server, Cpu, Edit2, Trash2, ShieldCheck, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/Pagination';
import { Provider, LLMModel, ProviderDisplayNames } from "@/types";

interface ProviderDetailProps {
    selectedProvider: Provider | undefined;
    models: LLMModel[];
    totalModels: number;
    modelPage: number;
    onModelPageChange: (page: number) => void;
    isModelsLoading: boolean;
    onEditProvider: (provider: Provider) => void;
    onDeleteProvider: (id: number, name: string) => void;
    onAddModel: () => void;
    onEditModel: (model: LLMModel) => void;
    onDeleteModel: (id: number, name: string) => void;
    itemsPerPage: number;
}

export const ProviderDetail: React.FC<ProviderDetailProps> = ({
    selectedProvider,
    models,
    totalModels,
    modelPage,
    onModelPageChange,
    isModelsLoading,
    onEditProvider,
    onDeleteProvider,
    onAddModel,
    onEditModel,
    onDeleteModel,
    itemsPerPage,
}) => {
    if (!selectedProvider) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-gray-100 border-dashed border-2">
                <div className="w-20 h-20 rounded-[2rem] bg-gray-50 flex items-center justify-center text-gray-200 mb-6">
                    <Server className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-gray-900">Select a Provider</h3>
                <p className="text-gray-400 font-medium max-w-xs text-center mt-2">
                    Choose an LLM provider from the list to manage its models and credentials.
                </p>
            </div>
        );
    }

    return (
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
                        variant="outline"
                        onClick={() => onEditProvider(selectedProvider)}
                        className="bg-white border-gray-100 text-gray-600 hover:text-primary hover:bg-primary/5 hover:border-primary/20"
                    >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Provider
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => onDeleteProvider(selectedProvider.id, selectedProvider.display_name)}
                        className="bg-white border-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200"
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
                        onClick={onAddModel}
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
                                                        onClick={() => onEditModel(model)}
                                                        className="p-2 hover:bg-primary/5 rounded-lg text-gray-400 hover:text-primary transition-all"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteModel(model.id, model.display_name)}
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

                            {totalModels > itemsPerPage && (
                                <div className="pt-4 border-t border-gray-50 mt-auto">
                                    <Pagination
                                        currentPage={modelPage}
                                        totalItems={totalModels}
                                        itemsPerPage={itemsPerPage}
                                        totalPages={Math.ceil(totalModels / itemsPerPage)}
                                        onPageChange={onModelPageChange}
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
    );
};
