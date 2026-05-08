import React from 'react';
import { Plus, Play, Loader2, ChevronLeft, CheckCircle2, XCircle, AlertCircle, Clock, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TestSuiteHeaderProps {
    suiteName?: string;
    status?: string;
    isRunningAll: boolean;
    onRunAll: () => void;
    onAddTestCase: () => void;
    onBack: () => void;
    onAbort?: () => void;
    isAborting?: boolean;
}

export const TestSuiteHeader: React.FC<TestSuiteHeaderProps> = ({
    suiteName = 'Test Suite',
    status,
    isRunningAll,
    onRunAll,
    onAddTestCase,
    onBack,
    onAbort,
    isAborting
}) => {

    const renderStatusBadge = () => {
        if (!status && !isRunningAll) return null;

        const s = (status || (isRunningAll ? 'RUNNING' : '')).toUpperCase();
        if (!s) return null;

        const isSuccess = s === 'PASSED' || s === 'SUCCESS' || s === 'EXECUTED';
        const isFailure = s === 'FAILED' || s === 'FAILURE';
        const isAborted = s === 'ABORTED';
        const isError = s === 'ERROR';
        const isRunning = s === 'RUNNING';
        const isQueued = s === 'QUEUED' || s === 'PENDING';

        const colors = isSuccess ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
            isFailure ? 'bg-rose-50 text-rose-600 border-rose-100' :
                isAborted ? 'bg-slate-100 text-slate-600 border-slate-200' :
                    isError ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        isRunning ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            'bg-gray-50 text-gray-500 border-gray-100';

        return (
            <div className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm ${colors} text-[10px] normal-case tracking-wider`}>
                {isSuccess && <CheckCircle2 className="w-4 h-4" />}
                {isFailure && <XCircle className="w-4 h-4" />}
                {isAborted && <StopCircle className="w-4 h-4" />}
                {isError && <AlertCircle className="w-4 h-4" />}
                {isRunning && <Loader2 className="w-4 h-4 animate-spin" />}
                {isQueued && <Clock className="w-3.5 h-3.5" />}
                <span className="font-black uppercase">
                    {s}
                </span>
            </div>
        );
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="h-12 w-12 rounded-[1.25rem] bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                </Button>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight capitalize flex items-center gap-3">
                        {suiteName}
                        {renderStatusBadge()}
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Management & Execution
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Button
                    onClick={onRunAll}
                    disabled={isRunningAll || isAborting}
                    className="h-11 px-6 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
                >
                    {isRunningAll ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Play className="w-5 h-5" />
                    )}
                    {isRunningAll ? 'Running...' : 'Run All'}
                </Button>

                {(isRunningAll || isAborting) && onAbort && (
                    <Button
                        onClick={onAbort}
                        disabled={isAborting}
                        variant="destructive"
                        className="h-11 px-6 rounded-xl font-bold shadow-lg shadow-red-200 flex items-center gap-2 transition-all active:scale-95"
                    >
                        <StopCircle className="w-5 h-5" />
                        {isAborting ? 'Aborting...' : 'Abort Run'}
                    </Button>
                )}

                {!isRunningAll && (
                    <Button
                        onClick={onAddTestCase}
                        className="h-11 px-6 bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 rounded-xl font-bold shadow-sm transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Case
                    </Button>
                )}
            </div>
        </div>
    );
};
