import React, { useEffect, useState } from 'react';
import { X, Server, Globe, Key, Plus, Trash2, Settings2, Eye, EyeOff, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/GeneralComponents';
import { llmService } from '@/services/llmService';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Provider, ProviderCreate, ProviderUpdate, ProviderType, ProviderDisplayNames } from '@/types/llm';

interface ProviderFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: ProviderCreate) => Promise<void>;
    editingProvider?: Provider;
    onEdit: (id: number, data: ProviderUpdate) => Promise<void>;
    error: string | null;
    onClearError?: () => void;
    isLoading: boolean;
}

interface ConfigPair {
    key: string;
    value: string;
}

export const ProviderFormModal: React.FC<ProviderFormModalProps> = ({
    isOpen,
    onClose,
    onAdd,
    editingProvider,
    onEdit,
    error,
    onClearError,
    isLoading,
}) => {
    const [displayName, setDisplayName] = useState('');
    const [providerType, setProviderType] = useState<ProviderType>(ProviderType.OPENAI);
    const [baseUrl, setBaseUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [configPairs, setConfigPairs] = useState<ConfigPair[]>([]);
    
    // API Key management states
    const [isApiKeyRevealed, setIsApiKeyRevealed] = useState(false);
    const [revealedApiKey, setRevealedApiKey] = useState<string | null>(null);
    const [isUpdatingApiKey, setIsUpdatingApiKey] = useState(false);
    const [newApiKey, setNewApiKey] = useState('');

    useEffect(() => {
        if (editingProvider) {
            setDisplayName(editingProvider.display_name);
            setProviderType(editingProvider.provider_type);
            setBaseUrl(editingProvider.base_url || '');
            setApiKey(''); // We don't get the key from ProviderRead
            setIsApiKeyRevealed(false);
            setRevealedApiKey(null);
            setIsUpdatingApiKey(false);
            setNewApiKey('');
            
            // Convert JSON object to pairs for the UI
            const pairs = Object.entries(editingProvider.additional_config || {}).map(([key, value]) => ({
                key,
                value: typeof value === 'object' ? JSON.stringify(value) : String(value)
            }));
            setConfigPairs(pairs.length > 0 ? pairs : [{ key: '', value: '' }]);
        } else {
            setDisplayName('');
            setProviderType(ProviderType.OPENAI);
            setBaseUrl('');
            setApiKey('');
            setConfigPairs([{ key: '', value: '' }]);
            setIsApiKeyRevealed(true); // Normal field for new providers
        }
    }, [editingProvider, isOpen]);

    if (!isOpen) return null;

    const handleRevealApiKey = async () => {
        if (!editingProvider) return;
        try {
            const key = await llmService.getProviderApiKey(editingProvider.id);
            setRevealedApiKey(key);
            setIsApiKeyRevealed(true);
        } catch (err) {
            console.error("Failed to reveal API key", err);
        }
    };

    const handleUpdateApiKey = async () => {
        if (!editingProvider) return;
        try {
            await llmService.updateProviderApiKey(editingProvider.id, newApiKey);
            setIsUpdatingApiKey(false);
            setNewApiKey('');
            setRevealedApiKey(newApiKey);
            setIsApiKeyRevealed(true);
        } catch (err) {
            console.error("Failed to update API key", err);
        }
    };

    const handleAddPair = () => {
        setConfigPairs([...configPairs, { key: '', value: '' }]);
    };

    const handleRemovePair = (index: number) => {
        const newPairs = configPairs.filter((_, i) => i !== index);
        setConfigPairs(newPairs.length > 0 ? newPairs : [{ key: '', value: '' }]);
    };

    const handlePairChange = (index: number, field: 'key' | 'value', val: string) => {
        const newPairs = [...configPairs];
        newPairs[index][field] = val;
        setConfigPairs(newPairs);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Convert pairs back to JSON object
        const additional_config: Record<string, any> = {};
        configPairs.forEach(pair => {
            if (pair.key.trim()) {
                let val: any = pair.value;
                // Try to parse as JSON if it looks like an object/array, otherwise keep as string
                if ((val.startsWith('{') && val.endsWith('}')) || (val.startsWith('[') && val.endsWith(']'))) {
                    try {
                        val = JSON.parse(val);
                    } catch (e) {
                        // If parsing fails, treat as string
                    }
                }
                additional_config[pair.key.trim()] = val;
            }
        });

        const providerData = {
            display_name: displayName,
            provider_type: providerType,
            base_url: baseUrl || undefined,
            api_key: !editingProvider ? apiKey : undefined, // Only send api_key on create
            additional_config
        };

        if (editingProvider) {
            onEdit(editingProvider.id, providerData);
        } else {
            onAdd(providerData as ProviderCreate);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-500 scale-100 opacity-100 flex flex-col max-h-[90vh] mx-4">
                <div className="p-8 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/5">
                            <Server className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-sans font-extrabold text-gray-900 tracking-tight">
                            {editingProvider ? 'Edit Provider' : 'Add New Provider'}
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

                    <form id="provider-form" onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Display Name</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                        <Server className="w-5 h-5" />
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                        placeholder="e.g. OpenAI Global"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Provider Type</label>
                                <Select value={providerType} onValueChange={(val) => setProviderType(val as ProviderType)}>
                                    <SelectTrigger className="w-full px-6 py-6 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all outline-none cursor-pointer h-auto">
                                        <SelectValue placeholder="Select provider type" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-gray-100 shadow-xl overflow-hidden z-[10000] max-h-60">
                                        {Object.values(ProviderType).map((type) => (
                                            <SelectItem key={type} value={type} className="py-2.5 font-bold text-gray-600 focus:bg-primary/5 focus:text-primary transition-colors cursor-pointer">
                                                {ProviderDisplayNames[type]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Connection Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Base URL (Optional)</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={baseUrl}
                                        onChange={(e) => setBaseUrl(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                        placeholder="https://api.openai.com/v1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">API Key</label>
                                {!editingProvider ? (
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                            <Key className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="password"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                            placeholder="sk-..."
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <div className="relative flex-grow group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                                    <Key className="w-5 h-5" />
                                                </div>
                                                <input
                                                    readOnly={!isUpdatingApiKey}
                                                    type={isApiKeyRevealed ? "text" : "password"}
                                                    value={
                                                        isUpdatingApiKey 
                                                            ? newApiKey 
                                                            : (isApiKeyRevealed 
                                                                ? (revealedApiKey || '') 
                                                                : (editingProvider?.has_api_key ? '••••••••••••••••' : 'No key configured'))
                                                    }
                                                    onChange={(e) => setNewApiKey(e.target.value)}
                                                    className={`w-full pl-12 pr-4 py-4 border border-gray-100 rounded-2xl text-sm font-bold transition-all outline-none ${
                                                        isUpdatingApiKey ? 'bg-white border-primary/30 ring-4 ring-primary/5 text-gray-900' : 'bg-gray-100 text-gray-400 cursor-default italic'
                                                    }`}
                                                />
                                            </div>
                                            {!isUpdatingApiKey ? (
                                                <Button
                                                    type="button"
                                                    disabled={!editingProvider?.has_api_key && !isApiKeyRevealed}
                                                    onClick={isApiKeyRevealed ? () => setIsApiKeyRevealed(false) : handleRevealApiKey}
                                                    variant="secondary"
                                                    className="px-4 bg-gray-50 border-gray-100 text-gray-500 h-auto rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    {isApiKeyRevealed ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </Button>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    onClick={handleUpdateApiKey}
                                                    className="px-4 bg-emerald-500 hover:bg-emerald-600 text-white h-auto rounded-2xl"
                                                >
                                                    <Save className="w-5 h-5" />
                                                </Button>
                                            )}
                                        </div>
                                        {!isUpdatingApiKey ? (
                                            <button 
                                                type="button"
                                                onClick={() => setIsUpdatingApiKey(true)}
                                                className="text-[10px] font-black text-primary uppercase tracking-widest self-end mr-2 hover:underline"
                                            >
                                                Change Key
                                            </button>
                                        ) : (
                                            <button 
                                                type="button"
                                                onClick={() => setIsUpdatingApiKey(false)}
                                                className="text-[10px] font-black text-gray-400 uppercase tracking-widest self-end mr-2 hover:underline"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Advanced Config Section */}
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-gray-900">
                                    <Settings2 className="w-4 h-4" />
                                    <h3 className="text-sm font-black uppercase tracking-tight">Additional Configuration</h3>
                                </div>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleAddPair}
                                    className="rounded-xl h-8 px-3 text-[10px] font-black uppercase tracking-widest border-gray-100"
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Property
                                </Button>
                            </div>
                            
                            <div className="space-y-3">
                                {configPairs.map((pair, index) => (
                                    <div key={index} className="flex gap-3 items-start group">
                                        <div className="flex-1 space-y-1">
                                            <input
                                                type="text"
                                                value={pair.key}
                                                onChange={(e) => handlePairChange(index, 'key', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-primary/30 outline-none transition-all"
                                                placeholder="Key (e.g. organization)"
                                            />
                                        </div>
                                        <div className="flex-[2] space-y-1">
                                            <input
                                                type="text"
                                                value={pair.value}
                                                onChange={(e) => handlePairChange(index, 'value', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-primary/30 outline-none transition-all"
                                                placeholder="Value (string, number, or JSON)"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePair(index)}
                                            className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium pl-1 italic">
                                * Keys are required. Values can be simple text or valid JSON arrays/objects.
                            </p>
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
                        form="provider-form"
                        type="submit"
                        disabled={isLoading}
                        className="py-6 bg-primary font-extrabold rounded-2xl hover:bg-primary/90 hover:shadow-lg transition-all active:scale-95 shadow-md shadow-primary/20"
                    >
                        {isLoading ? 'Processing...' : (editingProvider ? 'Save Updates' : 'Add Provider')}
                    </Button>
                </div>
            </div>
        </div>
    );
};
