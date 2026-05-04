import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, LayoutGrid } from 'lucide-react';
import { formatAction } from '@/utils/formatters';
import { ExpandableStepText } from '@/components/ExpandableStepText';
import { ModelSelector } from '@/components/ModelSelector';

interface ExecutionStepsSidebarProps {
    testCaseMode: string;
    plainText?: string;
    displaySteps: any[];
    selectedStepId: string;
    onSelectStep: (id: string) => void;
    onEditPrompt: () => void;
    terminationReason?: string | null;
    selectedModel?: string;
    onModelChange?: (model: string) => void;
    isRunning?: boolean;
}

export const ExecutionStepsSidebar: React.FC<ExecutionStepsSidebarProps> = ({
    testCaseMode,
    plainText,
    displaySteps,
    selectedStepId,
    onSelectStep,
    onEditPrompt,
    terminationReason,
    selectedModel,
    onModelChange,
    isRunning
}) => {
    const [isPromptExpanded, setIsPromptExpanded] = useState(false);

    return (
        <aside className="w-[400px] bg-white border-r border-gray-100 flex flex-col shadow-sm">
            <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2 w-full">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">Execution Steps</h3>
                <div className="flex-1" />
                {selectedModel && onModelChange && (
                    <ModelSelector
                        value={selectedModel}
                        onChange={onModelChange}
                        disabled={isRunning}
                        className="w-[140px] h-8 text-[10px] shrink-0"
                    />
                )}
            </div>

            {testCaseMode === 'plain' && plainText && (
                <div className="px-4 py-4 border-b border-gray-50 bg-white shadow-[inset_0_-2px_10px_rgba(0,0,0,0.01)] group/prompt relative">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Prompt Instructions</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/prompt:opacity-100 transition-opacity">
                            {plainText.length > 100 && (
                                <button
                                    onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                                    className="p-1.5 hover:bg-primary/10 rounded-md text-gray-400 hover:text-primary transition-colors"
                                    title={isPromptExpanded ? "Collapse Prompt" : "Expand Prompt"}
                                >
                                    {isPromptExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                            )}
                            <button
                                onClick={onEditPrompt}
                                className="p-1.5 hover:bg-primary/10 rounded-md text-gray-400 hover:text-primary transition-colors"
                                title="Edit Prompt"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                    <div
                        className="relative cursor-pointer group/text"
                        onClick={() => plainText!.length > 100 && setIsPromptExpanded(!isPromptExpanded)}
                    >
                        <p className={`text-xs font-medium text-gray-600 leading-relaxed italic border-l-2 border-primary/20 pl-3 pr-2 transition-all duration-300 ${isPromptExpanded ? '' : 'line-clamp-3'}`}>
                            {plainText}
                        </p>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {displaySteps.length === 0 && !terminationReason ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                        <LayoutGrid className="w-8 h-8 text-gray-300 mb-3" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No steps recorded</p>
                    </div>
                ) : (
                    <>
                        {displaySteps.map((step, index) => {
                            const isActive = selectedStepId === String(step.id);
                            const isRunningStep = step.status === 'running' || (!step.status && index === displaySteps.length - 1 && isRunning);
                            
                            return (
                                <div
                                    key={step.id}
                                    onClick={() => onSelectStep(String(step.id))}
                                    className={`group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                                        isActive
                                            ? 'bg-primary/[0.03] border-primary/40 shadow-[0_4px_15px_-4px_rgba(var(--primary-rgb),0.1)]'
                                            : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex gap-4">
                                        {/* Left: Step Number & Timeline */}
                                        <div className="flex flex-col items-center gap-2">
                                            <div className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center transition-all duration-300 ${
                                                isActive 
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                                    : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            {index < displaySteps.length - 1 && (
                                                <div className="w-0.5 flex-1 bg-gray-50 rounded-full" />
                                            )}
                                        </div>

                                        {/* Right: Content */}
                                        <div className="flex-1 min-w-0 flex flex-col gap-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 pt-1">
                                                    <ExpandableStepText 
                                                        text={formatAction(step.text)} 
                                                        maxLength={70}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-auto">
                                                <div className={`px-2 py-0.5 rounded-md flex items-center gap-1.5 ${
                                                    step.status === 'passed' ? 'bg-emerald-50 text-emerald-600' :
                                                    step.status === 'failed' ? 'bg-rose-50 text-rose-600' :
                                                    step.status === 'error' ? 'bg-red-50 text-red-600' :
                                                    step.status === 'aborted' ? 'bg-amber-50 text-amber-600' :
                                                    'bg-blue-50 text-blue-600'
                                                }`}>
                                                    <div className={`w-1 h-1 rounded-full ${
                                                        step.status === 'passed' ? 'bg-emerald-500' :
                                                        step.status === 'failed' ? 'bg-rose-500' :
                                                        step.status === 'error' ? 'bg-red-500' :
                                                        step.status === 'aborted' ? 'bg-amber-500' :
                                                        'bg-blue-500 animate-pulse'
                                                    }`} />
                                                    <span className="text-[10px] font-black uppercase tracking-wider">
                                                        {step.status || 'Running'}
                                                    </span>
                                                </div>
                                                
                                                {isRunningStep && (
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/5 rounded-md">
                                                        <span className="w-1 h-1 rounded-full bg-primary animate-ping" />
                                                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">Active</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Selection Accent */}
                                    <div className={`absolute top-0 left-0 w-1 h-full bg-primary transition-all duration-300 ${
                                        isActive ? 'opacity-100' : 'opacity-0'
                                    }`} />
                                </div>
                            );
                        })}

                        {terminationReason && (
                            <div className="p-4 rounded-xl border border-red-100 bg-red-50/50 shadow-sm relative overflow-hidden">
                                <div className="flex items-start gap-4">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                                        X
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Execution Terminated</h4>
                                        <p className="text-xs font-bold text-red-700 leading-relaxed italic border-l-2 border-red-200 pl-3">
                                            {terminationReason}
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                            </div>
                        )}
                    </>
                )}
            </div>
        </aside>
    );
};
