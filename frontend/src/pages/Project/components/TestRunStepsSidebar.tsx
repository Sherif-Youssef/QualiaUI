import React from 'react';
import { Camera, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import { TestStepRun } from '@/types/run';
import { formatAction } from '@/utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';

interface TestRunStepsSidebarProps {
    caseName: string;
    instruction: string | null;
    steps: TestStepRun[];
    selectedStepId: number | null;
    onSelectStep: (id: number) => void;
    onShowDiagnostics?: (step: TestStepRun, e: React.MouseEvent) => void;
}

export const TestRunStepsSidebar: React.FC<TestRunStepsSidebarProps> = ({
    caseName,
    instruction,
    steps,
    selectedStepId,
    onSelectStep
}) => {

    const [expandedDescId, setExpandedDescId] = React.useState<number | null>(null);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PASSED': return <CheckCircle2 className="w-4 h-4 text-success" />;
            case 'FAILED': return <XCircle className="w-4 h-4 text-failure" />;
            default: return <AlertCircle className="w-4 h-4 text-warning" />;
        }
    };

    const [isHoveringTooltip, setIsHoveringTooltip] = React.useState(false);

    const getFullDescription = (llmAction: string | null): string | null => {
        if (!llmAction) return null;
        try {
            const parsed = JSON.parse(llmAction);
            if (typeof parsed === 'object' && parsed !== null) {
                return parsed?.recreation_prompt || parsed?.intent || parsed?.action_description || llmAction;
            }
            return llmAction;
        } catch {
            return llmAction;
        }
    };

    return (
        <aside className="w-[400px] md:w-[450px] bg-white border-r border-gray-100 flex flex-col shadow-xl z-10">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">

                <div className="flex-1 min-w-0">
                    <div
                        className="flex items-center gap-2 mb-1 relative"
                        onMouseEnter={() => setIsHoveringTooltip(true)}
                        onMouseLeave={() => setIsHoveringTooltip(false)}
                    >
                        <h2 className="text-lg font-black text-gray-800 truncate leading-tight">
                            {caseName || 'Test Case Run'}
                        </h2>
                        <div className="relative flex items-center">
                            <AnimatePresence>
                                {isHoveringTooltip && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="absolute left-0 top-full mt-2 w-64 p-4 bg-gray-900/95 backdrop-blur-xl text-white text-[11px] font-medium rounded-2xl z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 pointer-events-none"
                                    >
                                        <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900/95 rotate-45" />
                                        <p className="leading-relaxed opacity-90">{instruction || 'No instruction provided'}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {steps.map((step, index) => {
                    const fullDesc = getFullDescription(step.llm_action);
                    const isDescExpanded = expandedDescId === step.id;

                    return (
                        <div
                            key={step.id}
                            onClick={() => onSelectStep(step.id)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer group relative overflow-hidden ${selectedStepId === step.id
                                ? 'bg-primary/[0.03] border-primary shadow-sm'
                                : 'bg-white border-gray-100 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <span className={`flex-shrink-0 w-8 h-8 rounded-lg text-xs font-black flex items-center justify-center transition-colors ${selectedStepId === step.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                                    }`}>
                                    {index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex gap-3 mb-2">
                                        <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${step.screenshot_after || step.screenshot_before ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                            }`}>
                                            <Camera className={`w-5 h-5 ${step.screenshot_after || step.screenshot_before ? 'scale-110' : 'opacity-40'}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm text-gray-700 font-medium leading-relaxed pt-0.5 transition-all">
                                                    Step {index + 1}
                                                </p>
                                                {fullDesc && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setExpandedDescId(isDescExpanded ? null : step.id);
                                                        }}
                                                        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${isDescExpanded
                                                            ? 'bg-primary text-white'
                                                            : 'bg-gray-100 text-gray-400 hover:bg-primary/10 hover:text-primary'
                                                            }`}
                                                        title="Show full description"
                                                    >
                                                        <Info className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 mb-2">
                                                {getStatusIcon(step.status)}
                                                <span className="text-[10px] font-black text-gray-400 capitalize tracking-widest">{step.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {isDescExpanded && fullDesc && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-1 ml-13 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Description</p>
                                                    <p className="text-xs text-gray-600 font-medium leading-relaxed break-words">
                                                        {fullDesc}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                            {selectedStepId === step.id && (
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                            )}
                        </div>
                    );
                })}
            </div>
        </aside>
    );
};
