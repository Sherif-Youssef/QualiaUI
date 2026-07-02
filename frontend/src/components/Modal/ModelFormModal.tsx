import React, { useEffect, useState } from 'react';
import { X, Cpu, Tag, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/GeneralComponents';
import { LLMModel, LLMModelCreate, LLMModelUpdate, Provider } from "@/types";

interface ModelFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: LLMModelCreate) => Promise<void>;
    editingModel?: LLMModel;
    onEdit: (id: number, data: LLMModelUpdate) => Promise<void>;
    providers: Provider[];
    error: string | null;
    onClearError?: () => void;
    isLoading: boolean;
}

export const ModelFormModal: React.FC<ModelFormModalProps> = ({
    isOpen,
    onClose,
    onAdd,
    editingModel,
    onEdit,
    providers,
    error,
    onClearError,
    isLoading,
}) => {
    const [modelName, setModelName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [providerId, setProviderId] = useState<string>('');

    useEffect(() => {
        if (editingModel) {
            setModelName(editingModel.model_name);
            setDisplayName(editingModel.display_name);
            setProviderId(String(editingModel.provider_id));
        } else {
            setModelName('');
            setDisplayName('');

            if (providers.length === 1) {
                setProviderId(String(providers[0].id));
            } else if (providers.length > 0) {
                setProviderId(String(providers[0].id));
            }
        }
    }, [editingModel, isOpen, providers]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const modelData = {
            model_name: modelName,
            display_name: displayName,
            provider_id: Number(providerId)
        };

        if (editingModel) {
            onEdit(editingModel.id, modelData);
        } else {
            onAdd(modelData as LLMModelCreate);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />

            <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-500 scale-100 opacity-100 flex flex-col max-h-[90vh] mx-4">
                <div className="p-8 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/5">
                            <Cpu className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-sans font-extrabold text-gray-900 tracking-tight">
                            {editingModel ? 'Edit LLM Model' : 'Add New LLM Model'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all active:scale-95">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-grow">
                    {error && (
                        <div className="mb-6 px-1">
                            <ErrorMessage message={error} onClose={onClearError} />
                        </div>
                    )}

                    <form id="model-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest pl-1">Provider</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors z-10 pointer-events-none">
                                    <Server className="w-5 h-5" />
                                </div>
                                <div className="w-full pl-12 pr-6 py-4 bg-gray-100 border border-gray-100 rounded-2xl text-sm font-bold text-gray-500 cursor-not-allowed h-auto">
                                    {providers.find(p => String(p.id) === providerId)?.display_name || 'Select a provider'}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest pl-1">Model Name (API Name)</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                    <Cpu className="w-5 h-5" />
                                </div>
                                <input
                                    required
                                    type="text"
                                    value={modelName}
                                    onChange={(e) => setModelName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                    placeholder="e.g. gpt-4o-mini"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest pl-1">Display Name</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                    <Tag className="w-5 h-5" />
                                </div>
                                <input
                                    required
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                    placeholder="e.g. GPT-4o Mini"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-8 border-t border-gray-50 bg-gray-50/20 grid grid-cols-2 gap-4 flex-shrink-0">
                    <Button
                        type="button"
                        onClick={onClose}
                        variant="secondary"
                        className="py-6 border-none bg-white font-extrabold rounded-2xl hover:bg-white hover:shadow-md transition-all active:scale-95 text-gray-500"
                    >
                        Cancel
                    </Button>
                    <Button
                        form="model-form"
                        type="submit"
                        disabled={isLoading}
                        className="py-6 bg-primary font-extrabold rounded-2xl hover:bg-primary/90 hover:shadow-lg transition-all active:scale-95 shadow-md shadow-primary/20"
                    >
                        {isLoading ? 'Processing...' : (editingModel ? 'Save Updates' : 'Add Model')}
                    </Button>
                </div>
            </div>
        </div>
    );
};
