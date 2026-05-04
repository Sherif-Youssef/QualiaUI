import React from 'react';
import { ArrowLeft, Play, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModelSelector } from '@/components/ModelSelector';

interface TestCaseHeaderProps {
    title: string;
    isRunning: boolean;
    isAborting?: boolean;
    selectedModel?: string;
    onModelChange?: (model: string) => void;
    onBack: () => void;
    onEdit: () => void;
    onRun: () => void;
    onAbort?: () => void;
    status?: string | null;
}

export const TestCaseHeader: React.FC<TestCaseHeaderProps> = ({
    title,
    isRunning,
    isAborting,
    selectedModel,
    onModelChange,
    onBack,
    onEdit,
    onRun,
    onAbort,
    status
}) => {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="w-9 h-9 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-600 hover:text-primary hover:border-primary transition-all hover:scale-105 active:scale-95"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-black text-gray-900 tracking-tight">
                            {title}
                        </h1>
                        {status && (
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm border ${
                                status === 'passed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                status === 'failed' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                status === 'error' ? 'bg-red-50 text-red-600 border-red-100' :
                                'bg-gray-50 text-gray-600 border-gray-100'
                            }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                    status === 'passed' ? 'bg-emerald-500' :
                                    status === 'failed' ? 'bg-rose-500' :
                                    status === 'error' ? 'bg-red-500' :
                                    'bg-gray-400'
                                }`} />
                                {status}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {selectedModel && onModelChange && (
                    <ModelSelector 
                        value={selectedModel} 
                        onChange={onModelChange} 
                        disabled={isRunning || !!isAborting} 
                    />
                )}

                <Button
                    onClick={onEdit}
                    disabled={isRunning || isAborting}
                    variant="outline"
                    className="h-11 px-6 font-bold text-gray-600 hover:bg-white hover:text-primary hover:border-primary rounded-xl transition-all"
                >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Test Case
                </Button>
                <Button
                    onClick={onRun}
                    disabled={isRunning || isAborting}
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl h-11 px-6 font-bold flex items-center gap-2 transition-all active:scale-[0.98]"
                >
                    <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : 'fill-white'}`} />
                    {isRunning ? 'Running...' : 'Run Test'}
                </Button>
                {(isRunning || isAborting) && onAbort && (
                    <Button
                        onClick={onAbort}
                        disabled={isAborting}
                        variant="destructive"
                        className="shadow-lg rounded-xl h-11 px-6 font-bold flex items-center gap-2 transition-all active:scale-[0.98]"
                    >
                        {isAborting ? 'Aborting...' : 'Abort'}
                    </Button>
                )}
            </div>
        </div>
    );
};
