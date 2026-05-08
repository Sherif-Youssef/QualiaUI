import React, { useState, useEffect } from 'react';
import { X, Sparkles, Cpu } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { llmService } from '@/services/llmService';
import { Provider, LLMModel } from '@/types/llm';
import { ErrorMessage } from '../GeneralComponents';

interface RunConfigurationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (llmModelId: number) => void;
    title?: string;
}

export const RunConfigurationModal: React.FC<RunConfigurationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Configure Run"
}) => {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [models, setModels] = useState<LLMModel[]>([]);
    const [selectedProviderId, setSelectedProviderId] = useState<string>('');
    const [selectedModelId, setSelectedModelId] = useState<string>('');
    const [isLoadingProviders, setIsLoadingProviders] = useState(false);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchProviders();
        } else {
            setSelectedProviderId('');
            setSelectedModelId('');
            setModels([]);
            setError(null);
        }
    }, [isOpen]);

    const fetchProviders = async () => {
        setIsLoadingProviders(true);
        setError(null);
        try {
            const response = await llmService.listProviders(0, 100);
            setProviders(response.items);
        } catch (err) {
            setError("Failed to load providers");
            console.error(err);
        } finally {
            setIsLoadingProviders(false);
        }
    };

    const fetchModels = async (providerId: number) => {
        setIsLoadingModels(true);
        setError(null);
        try {
            const response = await llmService.listModels(0, 100, undefined, providerId);
            setModels(response.items);
        } catch (err) {
            setError("Failed to load models for selected provider");
            console.error(err);
        } finally {
            setIsLoadingModels(false);
        }
    };

    const handleProviderChange = (value: string) => {
        setSelectedProviderId(value);
        setSelectedModelId('');
        fetchModels(parseInt(value));
    };

    const handleConfirm = () => {
        if (selectedModelId) {
            onConfirm(parseInt(selectedModelId));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-200 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        {title}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" strokeWidth={2} />
                    </button>
                </div>

                <div className="p-6 space-y-6 bg-white">
                    {error && <ErrorMessage message={error} />}

                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 block">
                            Provider
                        </Label>
                        <Select
                            value={selectedProviderId}
                            onValueChange={handleProviderChange}
                            disabled={isLoadingProviders}
                        >
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder={isLoadingProviders ? "Loading providers..." : "Select provider"} />
                            </SelectTrigger>
                            <SelectContent>
                                {providers.map((provider) => (
                                    <SelectItem key={provider.id} value={provider.id.toString()}>
                                        {provider.display_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 block">
                            LLM Model
                        </Label>
                        <Select
                            value={selectedModelId}
                            onValueChange={setSelectedModelId}
                            disabled={isLoadingModels || !selectedProviderId}
                        >
                            <SelectTrigger className="h-11">
                                <div className="flex items-center gap-2">
                                    <Cpu className="w-4 h-4 text-primary" />
                                    <SelectValue placeholder={
                                        isLoadingModels 
                                            ? "Loading models..." 
                                            : !selectedProviderId 
                                                ? "Select provider first" 
                                                : "Select model"
                                    } />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {models.map((model) => (
                                    <SelectItem key={model.id} value={model.id.toString()}>
                                        {model.display_name}
                                    </SelectItem>
                                ))}
                                {models.length === 0 && selectedProviderId && !isLoadingModels && (
                                    <div className="px-2 py-4 text-center text-sm text-gray-500">
                                        No models found for this provider
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50/50">
                    <Button onClick={onClose} variant="secondary" className="px-6 h-11">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        className="px-8 h-11 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 transition-all font-bold"
                        disabled={!selectedModelId}
                    >
                        Start Run
                    </Button>
                </div>
            </div>
        </div>
    );
};
