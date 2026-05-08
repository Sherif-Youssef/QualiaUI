import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRunStreaming } from '@/hooks/useRunStreaming';
import { runService } from '@/services/runService';
import { TestSuiteRun, TestCaseRun } from '@/types/run';
import { parseUTCDate } from '@/utils/formatters';
import { ErrorMessage } from '@/components/GeneralComponents';
import { TestSuiteManagerLoading } from '../TestSuiteManager/TestSuiteManagerLoading';
import { CheckCircle2, XCircle, AlertCircle, ChevronLeft, ArrowRight, Clock, FileText, StopCircle, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopNav } from '@/components/TopNav';

export const TestSuiteRunDashboardPage: React.FC = () => {
    const { projectId, suiteId, runId } = useParams<{ projectId: string; suiteId: string; runId: string }>();
    const navigate = useNavigate();
    const [suiteRun, setSuiteRun] = useState<(TestSuiteRun & { testcase_runs: TestCaseRun[] }) | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAborting, setIsAborting] = useState(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isFetchingRef = useRef(false);
    const [isDownloadingReport, setIsDownloadingReport] = useState(false);

    const handleDownloadReport = async () => {
        if (!runId) return;
        setIsDownloadingReport(true);
        try {
            await runService.downloadTestSuiteReport(parseInt(runId));
        } catch (err: any) {
            console.error('Download report error:', err);
            setError('Failed to download report.');
        } finally {
            setIsDownloadingReport(false);
        }
    };

    const fetchRunDetails = useCallback(async () => {
        if (!runId) return;

        try {
            const id = parseInt(runId);
            const data = await runService.getTestSuiteRunDetails(id);
            setSuiteRun(data);
        } catch (err: any) {
            console.error('Run dashboard details error:', err);
            setError(err.response?.data?.detail || 'Failed to load run details.');
        } finally {
            setIsLoading(false);
        }
    }, [runId]);

    const debouncedFetchRunDetails = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(async () => {
            if (isFetchingRef.current) return;
            isFetchingRef.current = true;
            try {
                await fetchRunDetails();
            } finally {
                isFetchingRef.current = false;
            }
        }, 1000);
    }, [fetchRunDetails]);

    useEffect(() => {
        if (!suiteRun) setIsLoading(true);
        fetchRunDetails(); // Initial fetch
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [runId, fetchRunDetails]);

    const handleStatusChange = useCallback(() => {
        debouncedFetchRunDetails();
    }, [debouncedFetchRunDetails]);

    useRunStreaming({
        scope: 'TESTSUITE',
        runId: runId!,
        onStatusChange: handleStatusChange,
        onStepUpdate: handleStatusChange
    });

    const handleAbort = async () => {
        if (!runId) return;
        setIsAborting(true);
        try {
            await runService.abortTestSuiteRun(parseInt(runId));
        } catch (err: any) {
            console.error('Abort error:', err);
            setError(err.response?.data?.detail || 'Failed to abort run.');
            setIsAborting(false);
        }
    };



    const getStatusIcon = (status: string) => {
        const s = status.toUpperCase();
        switch (s) {
            case 'PASSED':
            case 'SUCCESS':
            case 'EXECUTED': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'FAILED':
            case 'FAILURE': return <XCircle className="w-4 h-4 text-rose-500" />;
            case 'ERROR': return <AlertCircle className="w-4 h-4 text-amber-500" />;
            case 'ABORTED': return <StopCircle className="w-4 h-4 text-slate-500" />;
            case 'RUNNING': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
            case 'QUEUED':
            case 'PENDING': return <Clock className="w-4 h-4 text-gray-400" />;
            default: return <div className="w-4 h-4" />;
        }
    };

    const calculateDuration = (startAt: string | null, endAt: string | null) => {
        if (!startAt || !endAt) return 'Running...';
        const start = parseUTCDate(startAt)?.getTime() || 0;
        const end = parseUTCDate(endAt)?.getTime() || 0;
        const diffInSeconds = Math.floor((end - start) / 1000);
        if (diffInSeconds < 60) return `${diffInSeconds}s`;
        return `${Math.floor(diffInSeconds / 60)}m ${diffInSeconds % 60}s`;
    };

    if (isLoading) return <TestSuiteManagerLoading />;
    if (error) return <div className="p-8"><ErrorMessage message={error} onClose={() => setError(null)} /></div>;
    if (!suiteRun) return <div className="p-8 text-center text-gray-500 font-bold">Run not found</div>;

    const isAnyCaseActive = suiteRun.testcase_runs.some(tr => 
        ['RUNNING', 'QUEUED', 'PENDING'].includes(tr.status?.toUpperCase() || '')
    );
    const isRunning = ['RUNNING', 'QUEUED', 'PENDING'].includes(suiteRun.status?.toUpperCase() || '') && isAnyCaseActive;

    return (
        <div className="min-h-screen bg-gray-50 text-left font-sans">
            <TopNav />
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 text-gray-400 hover:text-primary transition-all group/back"
                            >
                                <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover/back:border-primary group-hover/back:text-primary transition-colors">
                                    <ChevronLeft className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] leading-none">
                                    Back
                                </span>
                            </button>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight capitalize truncate max-w-2xl flex items-center gap-3">
                                    <div className="truncate">
                                        {suiteRun.name || 'Test Suite Run'}
                                    </div>
                                    {suiteRun.status && (() => {
                                        const s = (suiteRun.status.toUpperCase() === 'QUEUED' && isAnyCaseActive) ? 'RUNNING' : suiteRun.status.toUpperCase();

                                        const isSuccess = ['PASSED', 'SUCCESS', 'EXECUTED'].includes(s);
                                        const isFailure = ['FAILED', 'FAILURE'].includes(s);
                                        const isAborted = s === 'ABORTED';
                                        const isError = s === 'ERROR';
                                        const isRunningStatus = s === 'RUNNING';
                                        const colors = isSuccess ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50' :
                                            isFailure ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-50' :
                                                isAborted ? 'bg-slate-100 text-slate-600 border-slate-200 shadow-slate-50' :
                                                    isError ? 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50' :
                                                        isRunningStatus ? 'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-50' :
                                                            'bg-gray-50 text-gray-400 border-gray-100 shadow-gray-50';

                                        return (
                                            <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm ${colors} text-[10px] font-black uppercase tracking-wider`}>
                                                {getStatusIcon(s)}
                                                <span className="font-black">
                                                    {s}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 self-end md:self-center">
                            {!isRunning && (
                                <Button
                                    onClick={handleDownloadReport}
                                    disabled={isDownloadingReport}
                                    variant="outline"
                                    className="h-11 px-6 rounded-xl font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95"
                                >
                                    {isDownloadingReport ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                    {isDownloadingReport ? 'Exporting...' : 'Export'}
                                </Button>
                            )}
                            {isRunning && (
                                <Button
                                    onClick={handleAbort}
                                    disabled={isAborting}
                                    variant="destructive"
                                    className="h-11 px-6 rounded-xl font-bold shadow-lg shadow-red-200 flex items-center gap-2 transition-all active:scale-95"
                                >
                                    <StopCircle className="w-5 h-5" />
                                    {isAborting ? 'Aborting...' : 'Abort Run'}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="text-[10px] font-black text-gray-400 capitalize tracking-widest">
                                {suiteRun.testcase_runs.length} Cases in this Run
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden transition-all duration-500">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 capitalize tracking-widest">
                                            Case Name
                                        </th>
                                        <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 capitalize tracking-widest">
                                            Status
                                        </th>
                                        <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 capitalize tracking-widest">
                                            Duration
                                        </th>
                                        <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 capitalize tracking-widest">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {suiteRun.testcase_runs.map((caseRun) => (
                                        <tr
                                            key={caseRun.id}
                                            onClick={() => navigate(`/project/${projectId}/suite/${suiteId}/case/${caseRun.testcase_id}/run`, {
                                                state: {
                                                    runId: caseRun.id,
                                                    scope: 'TESTCASE',
                                                    parentSuiteRunId: parseInt(runId!)
                                                }
                                            })}
                                            className="hover:bg-gray-50/50 cursor-pointer transition-all group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                                                        <FileText className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-gray-900 group-hover:text-primary transition-all">
                                                            {caseRun.name || `Test Case Run #${caseRun.id}`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                {(() => {
                                                    const s = (caseRun.status || '').toUpperCase();
                                                    const isSuccess = ['PASSED', 'SUCCESS', 'EXECUTED'].includes(s);
                                                    const isFailure = ['FAILED', 'FAILURE'].includes(s);
                                                    const isError = s === 'ERROR';
                                                    const isRunningStatus = s === 'RUNNING';
                                                    const isAborted = s === 'ABORTED';

                                                    const colors = isSuccess ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50' :
                                                        isFailure ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-50' :
                                                            isError ? 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50' :
                                                                isRunningStatus ? 'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-50' :
                                                                    isAborted ? 'bg-slate-100 text-slate-600 border-slate-200 shadow-slate-50' :
                                                                        'bg-gray-50 text-gray-400 border-gray-100 shadow-gray-50';

                                                    return (
                                                        <div className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-full border shadow-sm mx-auto w-fit transition-all group-hover:scale-105 ${colors}`}>
                                                            {getStatusIcon(s)}
                                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                                {s}
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-8 py-6 text-center text-[11px] font-black text-gray-400 capitalize tracking-widest">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-300" />
                                                    {calculateDuration(caseRun.started_at, caseRun.finished_at)}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                                                        <ArrowRight className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
