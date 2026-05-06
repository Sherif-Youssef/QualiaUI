import { CheckCircle2, XCircle, StopCircle, AlertTriangle, ChevronLeft } from 'lucide-react';
import { TestStepRun } from '@/types/run';
import { ExpandableStepText } from '@/components/ExpandableStepText';

interface TestRunStepsSidebarProps {
    caseName: string;
    steps: TestStepRun[];
    selectedStepId: number | null;
    onSelectStep: (id: number) => void;
    onShowDiagnostics?: (step: TestStepRun, e: React.MouseEvent) => void;
    terminationReason?: string | null;
    status?: string;
    onBack?: () => void;
}

export const TestRunStepsSidebar: React.FC<TestRunStepsSidebarProps> = ({
    caseName,
    steps,
    selectedStepId,
    onSelectStep,
    terminationReason,
    status,
    onBack
}) => {
    return (
        <aside className="w-[400px] md:w-[450px] bg-white border-r border-gray-100 flex flex-col shadow-xl z-10">
            {onBack && (
                <div className="p-4 border-b border-gray-50 flex items-center bg-white">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-400 hover:text-primary transition-all group/back"
                    >
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover/back:border-primary group-hover/back:text-primary transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] leading-none">
                            Back
                        </span>
                    </button>
                </div>
            )}
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <h2 className="text-xl font-black text-gray-900 truncate leading-tight">
                            {caseName || 'Test Case Run'}
                        </h2>
                        {status && (
                            <div className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm ${status === 'PASSED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                status === 'FAILED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                    status === 'ABORTED' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                        'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                {status === 'PASSED' ? <CheckCircle2 className="w-4 h-4" /> :
                                    status === 'FAILED' ? <XCircle className="w-4 h-4" /> :
                                        status === 'ABORTED' ? <StopCircle className="w-4 h-4" /> :
                                            <AlertTriangle className="w-4 h-4" />}
                                <span className="text-[10px] font-black uppercase tracking-wider">
                                    {status}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {terminationReason && (
                    <div className={`p-4 rounded-2xl border shadow-sm relative overflow-hidden ${
                        status === 'PASSED' 
                            ? 'bg-emerald-50/30 border-emerald-100' 
                            : status === 'FAILED'
                                ? 'bg-rose-50/30 border-rose-100'
                                : 'bg-blue-50/30 border-blue-100'
                    }`}>
                        <div className="flex gap-4">
                            <div className={`w-8 h-8 rounded-xl text-white text-[10px] font-black flex items-center justify-center shadow-lg ${
                                status === 'PASSED'
                                    ? 'bg-emerald-500 shadow-emerald-200'
                                    : status === 'FAILED'
                                        ? 'bg-rose-500 shadow-rose-200'
                                        : 'bg-blue-500 shadow-blue-200'
                            }`}>
                                {status === 'PASSED' ? <CheckCircle2 className="w-4 h-4" /> : 'X'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                                    status === 'PASSED'
                                        ? 'text-emerald-600'
                                        : status === 'FAILED'
                                            ? 'text-rose-600'
                                            : 'text-blue-600'
                                }`}>
                                    Run Conclusion
                                </h4>
                                <p className={`text-xs font-bold leading-relaxed italic border-l-2 pl-3 ${
                                    status === 'PASSED'
                                        ? 'text-emerald-700/80 border-emerald-200'
                                        : status === 'FAILED'
                                            ? 'text-rose-700/80 border-rose-200'
                                            : 'text-blue-700/80 border-blue-200'
                                }`}>
                                    {terminationReason}
                                </p>
                            </div>
                        </div>
                        <div className={`absolute top-0 left-0 w-1 h-full ${
                            status === 'PASSED'
                                ? 'bg-emerald-500'
                                : status === 'FAILED'
                                    ? 'bg-rose-500'
                                    : 'bg-blue-500'
                        }`} />
                    </div>
                )}

                {steps.map((step, index) => {
                    const fullDesc = step.recreation_prompt;
                    const isActive = selectedStepId === step.id;

                    return (
                        <div
                            key={step.id}
                            onClick={() => onSelectStep(step.id)}
                            className={`group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${isActive
                                ? 'bg-primary/[0.03] border-primary/40 shadow-[0_4px_15px_-4px_rgba(var(--primary-rgb),0.1)]'
                                : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md'
                                }`}
                        >
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center transition-all duration-300 ${isActive
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className="w-0.5 flex-1 bg-gray-50 rounded-full" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col gap-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 pt-1">
                                            <ExpandableStepText
                                                text={fullDesc || `Step ${index + 1}`}
                                                maxLength={70}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto">
                                        {(() => {
                                            const status = step.status;
                                            const isSuccess = status === 'PASSED';
                                            const isFailure = status === 'FAILED';

                                            const colorClass = isSuccess ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                isFailure ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    'bg-amber-50 text-amber-600 border-amber-100';

                                            const dotClass = isSuccess ? 'bg-emerald-500' :
                                                isFailure ? 'bg-rose-500' :
                                                    'bg-amber-500';

                                            return (
                                                <div className={`px-2 py-0.5 rounded-md flex items-center gap-1.5 border ${colorClass}`}>
                                                    <div className={`w-1 h-1 rounded-full ${dotClass}`} />
                                                    <span className="text-[10px] font-black uppercase tracking-wider">
                                                        {status}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {step.status === 'FAILED' && step.error_message && (
                                        <div className="mt-1 p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Failure Reason</p>
                                            </div>
                                            <p className="text-xs text-rose-700/90 font-medium leading-relaxed break-words pl-3.5 border-l-2 border-rose-200">
                                                {step.error_message}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Selection Accent */}
                            <div className={`absolute top-0 left-0 w-1 h-full bg-primary transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0'
                                }`} />
                        </div>
                    );
                })}
            </div>
        </aside>
    );
};
