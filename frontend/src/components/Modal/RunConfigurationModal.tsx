import React, { useState, useEffect } from 'react';
import { X, Sparkles, Cpu, Camera, Video } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Checkbox } from '../ui/checkbox';
import { llmService } from '@/services/llmService';
import { Provider, LLMModel } from "@/types";
import { ErrorMessage } from '../GeneralComponents';
import { Timer, Layers } from 'lucide-react';

interface RunConfigurationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (llmModelId: number, options: { 
        useScreenshots: boolean; 
        useVideo: boolean;
        timeout: number;
        shouldGroupActions: boolean;
    }) => void;
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
    const [useScreenshots, setUseScreenshots] = useState(false);
    const [useVideo, setUseVideo] = useState(true);
    const [timeout, setTimeoutVal] = useState(60000);
    const [shouldGroupActions, setShouldGroupActions] = useState(false);
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
            setUseScreenshots(false);
            setUseVideo(true);
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
            onConfirm(parseInt(selectedModelId), { 
                useScreenshots, 
                useVideo,
                timeout,
                shouldGroupActions
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                    <h2 className="text-xl font-bold text-gray-800 font-sans flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        {title}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" strokeWidth={2} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white [scrollbar-width:thin] [scrollbar-color:#E5E7EB_transparent]">
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

                    <div className="space-y-4 pt-2">
                        <Label className="text-sm font-semibold text-gray-700 block">
                            Run Options
                        </Label>
                        <div className="grid grid-cols-1 gap-3">
                            <div 
                                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => setUseScreenshots(!useScreenshots)}
                            >
                                <Checkbox 
                                    id="useScreenshots" 
                                    checked={useScreenshots}
                                    onCheckedChange={(checked) => setUseScreenshots(!!checked)}
                                />
                                <div className="flex items-center gap-2 flex-1">
                                    <Camera className="w-4 h-4 text-gray-500" />
                                    <div className="grid gap-0.5">
                                        <label
                                            htmlFor="useScreenshots"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            Use Screenshots
                                        </label>
                                        <p className="text-xs text-gray-500">Send page screenshots to LLM for better context</p>
                                    </div>
                                </div>
                            </div>

                            <div 
                                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => setUseVideo(!useVideo)}
                            >
                                <Checkbox 
                                    id="useVideo" 
                                    checked={useVideo}
                                    onCheckedChange={(checked) => setUseVideo(!!checked)}
                                />
                                <div className="flex items-center gap-2 flex-1">
                                    <Video className="w-4 h-4 text-gray-500" />
                                    <div className="grid gap-0.5">
                                        <label
                                            htmlFor="useVideo"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            Record Video
                                        </label>
                                        <p className="text-xs text-gray-500">Record a video of the test execution</p>
                                    </div>
                                </div>
                            </div>

                            <div 
                                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => setShouldGroupActions(!shouldGroupActions)}
                            >
                                <Checkbox 
                                    id="shouldGroupActions" 
                                    checked={shouldGroupActions}
                                    onCheckedChange={(checked) => setShouldGroupActions(!!checked)}
                                />
                                <div className="flex items-center gap-2 flex-1">
                                    <Layers className="w-4 h-4 text-gray-500" />
                                    <div className="grid gap-0.5">
                                        <label
                                            htmlFor="shouldGroupActions"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            Group Actions
                                        </label>
                                        <p className="text-xs text-gray-500">Allow model to perform multiple actions at once</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 p-3 rounded-lg border border-gray-100 bg-gray-50/30">
                                <div className="flex items-center gap-2 mb-1">
                                    <Timer className="w-4 h-4 text-gray-500" />
                                    <Label htmlFor="timeout" className="text-sm font-semibold text-gray-700">
                                        Step Timeout (ms)
                                    </Label>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="timeout"
                                        type="number"
                                        value={timeout}
                                        onChange={(e) => setTimeoutVal(parseInt(e.target.value) || 60000)}
                                        className="h-10 pl-3 pr-10"
                                        min={5000}
                                        step={5000}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">
                                        ms
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium">Maximum wait time for each test step</p>
                            </div>
                        </div>
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
