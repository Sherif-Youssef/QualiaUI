import React from 'react';
import { LayoutGrid } from 'lucide-react';
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
    status?: string | null;
}

export const ExecutionStepsSidebar: React.FC<ExecutionStepsSidebarProps> = ({
    displaySteps,
    selectedStepId,
    onSelectStep,
    terminationReason,
    selectedModel,
    onModelChange,
    isRunning,
    status
}) => {
    const isPassed = ['passed', 'success', 'executed'].includes(status?.toLowerCase() || '');

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



            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {(displaySteps.length === 0 && !terminationReason && !isRunning) ? (
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
                                    className={`group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${isActive
                                        ? 'bg-primary/[0.03] border-primary/40 shadow-[0_4px_15px_-4px_rgba(var(--primary-rgb),0.1)]'
                                        : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex gap-4">
                                        {/* Left: Step Number & Timeline */}
                                        <div className="flex flex-col items-center gap-2">
                                            <div className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center transition-all duration-300 ${isActive
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            {(index < displaySteps.length - 1 || (terminationReason && !isPassed)) && (
                                                <div className="w-0.5 flex-1 bg-gray-50 rounded-full" />
                                            )}
                                        </div>

                                        {/* Right: Content */}
                                        <div className="flex-1 min-w-0 flex flex-col gap-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 pt-1">
                                                    <ExpandableStepText
                                                        text={formatAction(step.text)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-auto">
                                                <div className={`px-2 py-0.5 rounded-md flex items-center gap-1.5 ${step.status === 'passed' ? 'bg-emerald-50 text-emerald-600' :
                                                    step.status === 'failed' ? 'bg-rose-50 text-rose-600' :
                                                        step.status === 'error' ? 'bg-amber-50 text-amber-600' :
                                                            step.status === 'aborted' ? 'bg-slate-100 text-slate-600' :
                                                                'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    <div className={`w-1 h-1 rounded-full ${step.status === 'passed' ? 'bg-emerald-500' :
                                                        step.status === 'failed' ? 'bg-rose-500' :
                                                            step.status === 'error' ? 'bg-amber-500' :
                                                                step.status === 'aborted' ? 'bg-slate-500' :
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
                                    <div className={`absolute top-0 left-0 w-1 h-full bg-primary transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0'
                                        }`} />
                                </div>
                            );
                        })}

                        {(terminationReason && !isPassed) && (() => {
                            const reason = terminationReason.toLowerCase();
                            const isAborted = reason.includes('abort');
                            const isError = reason.includes('error');
                            const colors = isAborted ? {
                                bg: 'bg-slate-50/50',
                                border: 'border-slate-200',
                                text: 'text-slate-600',
                                darkText: 'text-slate-700',
                                iconBg: 'bg-slate-500',
                                iconShadow: 'shadow-slate-200',
                                badgeBg: 'bg-slate-100',
                                badgeText: 'text-slate-700',
                                badgeBorder: 'border-slate-200',
                                accent: 'bg-slate-500',
                                label: 'Execution Aborted',
                                statusLabel: 'Aborted'
                            } : isError ? {
                                bg: 'bg-amber-50/50',
                                border: 'border-amber-200',
                                text: 'text-amber-600',
                                darkText: 'text-amber-700',
                                iconBg: 'bg-amber-500',
                                iconShadow: 'shadow-amber-200',
                                badgeBg: 'bg-amber-100',
                                badgeText: 'text-amber-700',
                                badgeBorder: 'border-amber-200',
                                accent: 'bg-amber-500',
                                label: 'Unexpected Error',
                                statusLabel: 'Error'
                            } : {
                                bg: 'bg-rose-50/50',
                                border: 'border-rose-200',
                                text: 'text-rose-600',
                                darkText: 'text-rose-700',
                                iconBg: 'bg-rose-500',
                                iconShadow: 'shadow-rose-200',
                                badgeBg: 'bg-rose-100',
                                badgeText: 'text-rose-700',
                                badgeBorder: 'border-rose-200',
                                accent: 'bg-rose-500',
                                label: 'Execution Failed',
                                statusLabel: 'Failed'
                            };

                            return (
                                <div className={`group relative p-4 rounded-2xl border transition-all duration-300 ${colors.bg} ${colors.border} shadow-sm overflow-hidden`}>
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center ${colors.iconBg} text-white shadow-lg ${colors.iconShadow}`}>
                                                {displaySteps.length + 1}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col gap-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 pt-1">
                                                    <h4 className={`text-[10px] font-black ${colors.text} uppercase tracking-widest mb-1`}>{colors.label}</h4>
                                                    <ExpandableStepText text={terminationReason || ''} />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-auto">
                                                <div className={`px-2 py-0.5 rounded-md flex items-center gap-1.5 ${colors.badgeBg} ${colors.badgeText}`}>
                                                    <div className={`w-1 h-1 rounded-full ${colors.accent}`} />
                                                    <span className="text-[10px] font-black uppercase tracking-wider">
                                                        {colors.statusLabel}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`absolute top-0 left-0 w-1 h-full ${colors.accent}`} />
                                </div>
                            );
                        })()}
                    </>
                )}
            </div>
        </aside>
    );
};
