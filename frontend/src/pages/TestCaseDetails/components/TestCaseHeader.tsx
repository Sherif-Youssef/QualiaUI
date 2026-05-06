import { ArrowLeft, Play, Pencil, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModelSelector } from '@/components/ModelSelector';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface TestCaseHeaderProps {
    title: string;
    isRunning: boolean;
    isAborting?: boolean;
    selectedModel?: string;
    onModelChange?: (model: string) => void;
    onBack: () => void;
    onEdit: () => void;
    onViewPrompt: () => void;
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
    onViewPrompt,
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
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm border ${status === 'passed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                status === 'executed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    status === 'failed' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                        status === 'error' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            status === 'aborted' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                'bg-gray-50 text-gray-600 border-gray-100'
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${status === 'passed' ? 'bg-emerald-500' :
                                    status === 'executed' ? 'bg-blue-500' :
                                        status === 'failed' ? 'bg-rose-500' :
                                            status === 'error' ? 'bg-amber-500' :
                                                status === 'aborted' ? 'bg-slate-500' :
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


                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            onClick={onViewPrompt}
                            variant="outline"
                            className="h-11 px-4 font-bold text-gray-400 hover:bg-white hover:text-primary hover:border-primary rounded-xl transition-all"
                        >
                            <FileText className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-primary text-white font-bold py-2 px-4 rounded-xl shadow-xl border-none">
                        <p>View Prompt Instructions</p>
                    </TooltipContent>
                </Tooltip>

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
                    {isRunning ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Play className="w-4 h-4 fill-white" />
                    )}
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
