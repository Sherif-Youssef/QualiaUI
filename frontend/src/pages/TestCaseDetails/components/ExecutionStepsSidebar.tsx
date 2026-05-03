import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, LayoutGrid, Camera } from 'lucide-react';
import { formatAction } from '@/utils/formatters';
import { ExpandableStepText } from '@/components/ExpandableStepText';

interface ExecutionStepsSidebarProps {
    testCaseMode: string;
    plainText?: string;
    displaySteps: any[];
    selectedStepId: string;
    onSelectStep: (id: string) => void;
    onEditPrompt: () => void;
}

export const ExecutionStepsSidebar: React.FC<ExecutionStepsSidebarProps> = ({
    testCaseMode,
    plainText,
    displaySteps,
    selectedStepId,
    onSelectStep,
    onEditPrompt
}) => {
    const [isPromptExpanded, setIsPromptExpanded] = useState(false);

    return (
        <aside className="w-[400px] bg-white border-r border-gray-100 flex flex-col shadow-sm">
            <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Execution Steps</h3>
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
                {displaySteps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                        <LayoutGrid className="w-8 h-8 text-gray-300 mb-3" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No steps recorded</p>
                    </div>
                ) : (
                    displaySteps.map((step, index) => (
                        <div
                            key={step.id}
                            onClick={() => onSelectStep(String(step.id))}
                            className={`p-4 rounded-xl border transition-all cursor-pointer group relative overflow-hidden ${selectedStepId === String(step.id)
                                ? 'bg-primary/[0.03] border-primary shadow-sm'
                                : 'bg-white border-gray-100 hover:border-gray-200'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <span className={`flex-shrink-0 w-8 h-8 rounded-lg text-xs font-black flex items-center justify-center transition-colors ${selectedStepId === String(step.id) ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'
                                    }`}>
                                    {index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex gap-3 mb-2">
                                        <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${step.screenshot ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-300'
                                            }`}>
                                            <Camera className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <ExpandableStepText text={formatAction(step.text)} />
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className={`w-1.5 h-1.5 rounded-full ${step.status === 'passed' ? 'bg-emerald-500' :
                                                    step.status === 'failed' ? 'bg-rose-500' : 'bg-gray-300'
                                                    }`} />
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                    {step.status || 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {selectedStepId === String(step.id) && (
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                            )}
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
};
