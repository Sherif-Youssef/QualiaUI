import React from 'react';
import { Camera, Pencil, Trash2, Play, Loader2, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { TestStep, TestCase } from '@/types/test-case';
import { formatAction } from '@/utils/formatters';

interface StepsSidebarProps {
    testCase: TestCase | null;
    steps: TestStep[];
    selectedStepId: string;
    onSelectStep: (id: string) => void;
    isRunning: boolean;
    finalStatus: 'passed' | 'failed' | null;
    onEditStep?: (step: TestStep, e: React.MouseEvent) => void;
    onDeleteStep?: (id: string, text: string, e: React.MouseEvent) => void;
}

export const StepsSidebar: React.FC<StepsSidebarProps> = ({
    testCase,
    steps,
    selectedStepId,
    onSelectStep,
    isRunning,
    finalStatus,
    onEditStep,
    onDeleteStep
}) => {
    const navigate = useNavigate();
    const { projectId, suiteId } = useParams<{ projectId: string; suiteId: string }>();

    const [isHoveringTooltip, setIsHoveringTooltip] = React.useState(false);

    return (
        <aside className="w-[400px] md:w-[450px] bg-white border-r border-gray-100 flex flex-col shadow-xl z-10">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <button
                    onClick={() => navigate(`/project/${projectId}/suite/${suiteId}`)}
                    className="flex items-center gap-2 text-gray-400 hover:text-primary transition-all group/back mb-6"
                >
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover/back:border-primary group-hover/back:text-primary transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">Back to Suite</span>
                </button>

                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                        <div
                            className="flex items-center gap-2 mb-1 relative"
                            onMouseEnter={() => setIsHoveringTooltip(true)}
                            onMouseLeave={() => setIsHoveringTooltip(false)}
                        >
                            <h2 className="text-lg font-black text-gray-800 truncate leading-tight">
                                {testCase?.name || 'Test Case'}
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
                                            <p className="leading-relaxed opacity-90">{testCase?.prompt || 'No instruction provided'}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            {isRunning && <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />}
                            {!isRunning && finalStatus === 'passed' && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                            {!isRunning && finalStatus === 'failed' && <XCircle className="w-4 h-4 text-failure shrink-0" />}
                        </div>
                        <p className="text-[10px] font-black capitalize tracking-widest text-muted-foreground flex items-center gap-1.5">
                            Version <span className="text-primary">{testCase?.runVersion || 'N/A'}</span>
                        </p>
                    </div>
                </div>
                <Button
                    disabled={isRunning}
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                    {isRunning ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Executing Test...</span>
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4" />
                            <span>Run Test Case</span>
                        </>
                    )}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {steps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-400 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-tighter">No steps recorded</p>
                    </div>
                ) : (
                    steps.map((step) => (
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
                                    {step.number}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex gap-3 mb-2">
                                        <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${step.screenshot ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                            }`}>
                                            <Camera className={`w-5 h-5 ${step.screenshot ? 'scale-110' : 'opacity-40'}`} />
                                        </div>
                                        <p className="text-sm text-gray-700 font-medium leading-relaxed pt-0.5 line-clamp-1 group-hover:line-clamp-none transition-all">
                                            {formatAction(step.text)}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-end gap-1 mt-1">
                                        {onEditStep && (
                                            <button
                                                onClick={(e) => onEditStep(step, e)}
                                                className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        {onDeleteStep && (
                                            <button
                                                onClick={(e) => onDeleteStep(step.id, step.text, e)}
                                                className="p-2 text-muted-foreground hover:text-failure hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {selectedStepId === step.id && (
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                            )}
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
};
