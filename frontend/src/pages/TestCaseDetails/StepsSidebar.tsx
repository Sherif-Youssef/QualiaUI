import React from 'react';
import { Camera, CheckCircle2, XCircle, AlertCircle, Trash2, Pencil, Play, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { TestStep, TestCase } from '@/types/test-case';
import { formatAction } from '@/utils/formatters';
import { ExpandableStepText } from '@/components/ExpandableStepText';

interface StepsSidebarProps {
    testCase: TestCase | null;
    steps: TestStep[];
    selectedStepId: string;
    onSelectStep: (id: string) => void;
    isRunning: boolean;
    finalStatus: 'passed' | 'failed' | null;
    onEditStep?: (step: TestStep, e: React.MouseEvent) => void;
    onDeleteStep?: (id: string, text: string, e: React.MouseEvent) => void;
    onRun: () => void;
    activeView: 'steps' | 'history';
    onViewChange: (view: 'steps' | 'history') => void;
}

const getStatusIcon = (status?: string) => {
    switch (status) {
        case 'passed': return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
        case 'failed': return <XCircle className="w-3 h-3 text-rose-500" />;
        default: return <AlertCircle className="w-3 h-3 text-gray-300" />;
    }
};

export const StepsSidebar: React.FC<StepsSidebarProps> = ({
    testCase,
    steps,
    selectedStepId,
    onSelectStep,
    isRunning,
    finalStatus,
    onEditStep,
    onDeleteStep,
    onRun,
    activeView,
    onViewChange
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

                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black text-gray-900 tracking-tight leading-tight truncate">
                                {testCase?.name || 'Loading...'}
                            </h1>
                            {finalStatus === 'passed' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                            {finalStatus === 'failed' && <XCircle className="w-5 h-5 text-rose-500" />}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onMouseEnter={() => setIsHoveringTooltip(true)}
                                onMouseLeave={() => setIsHoveringTooltip(false)}
                                className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline relative"
                            >
                                Details
                                <AnimatePresence>
                                    {isHoveringTooltip && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute left-0 top-full mt-2 w-64 p-4 bg-gray-900 text-white text-[11px] font-medium rounded-xl z-[100] shadow-2xl border border-white/10 pointer-events-none"
                                        >
                                            <p className="leading-relaxed opacity-90">{testCase?.prompt || 'No instruction provided'}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl mb-6 shadow-inner">
                    <button
                        onClick={() => onViewChange('steps')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'steps' ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Steps
                    </button>
                    <button
                        onClick={() => onViewChange('history')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'history' ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Run History
                    </button>
                </div>
                <Button
                    onClick={onRun}
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
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <ExpandableStepText text={formatAction(step.text)} />
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 mb-2">
                                                {getStatusIcon(step.status)}
                                                <span className="text-[10px] font-black text-gray-400 capitalize tracking-widest">{step.status}</span>
                                            </div>
                                        </div>
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
