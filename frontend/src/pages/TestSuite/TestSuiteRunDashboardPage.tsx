import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRunStreaming } from '@/hooks/useRunStreaming';
import { runService } from '@/services/runService';
import { TestSuiteRun, TestCaseRun } from "@/types";
import { parseUTCDate, formatDate } from '@/utils/formatters';
import { ErrorMessage } from '@/components/GeneralComponents';
import { TopNav } from '@/components/TopNav';
import {
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ArrowRight,
    Clock,
    FileText,
    StopCircle,
    Loader2,
    Download,
    LayoutGrid,
    Info,
    Settings,
    Cpu,
    User,
    Camera,
    Video,
    Hash,
    Calendar,
    Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TestSuiteLayout } from './TestSuiteLayout';

const DetailItem: React.FC<{ label: string; value: React.ReactNode; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-primary shrink-0">
            {icon}
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">{label}</span>
            <span className="text-sm font-bold text-gray-900">{value || '--'}</span>
        </div>
    </div>
);

const RunDetailsView: React.FC<{ suiteRun: TestSuiteRun & { testcase_runs: TestCaseRun[] } }> = ({ suiteRun }) => {
    const calculateDuration = (startAt: string | null, endAt: string | null) => {
        if (!startAt || !endAt) return null;
        const start = parseUTCDate(startAt)?.getTime() || 0;
        const end = parseUTCDate(endAt)?.getTime() || 0;
        const diffInSeconds = Math.floor((end - start) / 1000);
        if (diffInSeconds < 60) return `${diffInSeconds}s`;
        return `${Math.floor(diffInSeconds / 60)}m ${diffInSeconds % 60}s`;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DetailItem
                    label="Run ID"
                    value={suiteRun.id}
                    icon={<Hash className="w-5 h-5" />}
                />
                <DetailItem
                    label="Scope"
                    value={suiteRun.scope}
                    icon={<Layers className="w-5 h-5" />}
                />
                <DetailItem
                    label="Created At"
                    value={formatDate(suiteRun.created_at)}
                    icon={<Calendar className="w-5 h-5" />}
                />
                <DetailItem
                    label="Duration"
                    value={calculateDuration(suiteRun.started_at, suiteRun.finished_at)}
                    icon={<Clock className="w-5 h-5" />}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DetailItem
                    label="Run Mode"
                    value={suiteRun.mode}
                    icon={<Settings className="w-5 h-5" />}
                />
                <DetailItem
                    label="LLM Model"
                    value={suiteRun.llm_model?.display_name || suiteRun.llm_model?.model_name}
                    icon={<Cpu className="w-5 h-5" />}
                />
                <DetailItem
                    label="Initiated By"
                    value={suiteRun.user ? `${suiteRun.user.first_name} ${suiteRun.user.last_name}` : '--'}
                    icon={<User className="w-5 h-5" />}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-gray-400">
                        <Settings className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Run Options</span>
                    </div>
                    <div className="flex gap-4">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${suiteRun.use_screenshots ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                            <Camera className="w-4 h-4" />
                            <span className="text-xs font-bold">Screenshots {suiteRun.use_screenshots ? 'ON' : 'OFF'}</span>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${suiteRun.use_video ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                            <Video className="w-4 h-4" />
                            <span className="text-xs font-bold">Video Recording {suiteRun.use_video ? 'ON' : 'OFF'}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Technical Details
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Job UID</span>
                            <span className="text-[10px] font-mono font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded">{suiteRun.job_uid}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Cases</span>
                            <span className="text-xs font-bold text-gray-600">{suiteRun.testcase_runs.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export const TestSuiteRunDashboardPage: React.FC = () => {
    const { projectId, suiteId, runId } = useParams<{ projectId: string; suiteId: string; runId: string }>();
    const navigate = useNavigate();
    const [suiteRun, setSuiteRun] = useState<(TestSuiteRun & { testcase_runs: TestCaseRun[] }) | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAborting, setIsAborting] = useState(false);
    const debounceTimerRef = useRef<number | null>(null);
    const isFetchingRef = useRef(false);
    const [isDownloadingReport, setIsDownloadingReport] = useState(false);
    const [activeView, setActiveView] = useState<'cases' | 'details'>('cases');

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
            window.clearTimeout(debounceTimerRef.current);
        }
        
        debounceTimerRef.current = window.setTimeout(async () => {
            if (isFetchingRef.current) return;
            
            isFetchingRef.current = true;
            try {
                await fetchRunDetails();
            } finally {
                isFetchingRef.current = false;
            }
        }, 300);
    }, [fetchRunDetails]);

    useEffect(() => {
        if (!suiteRun) setIsLoading(true);
        fetchRunDetails();
        return () => {
            if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
        };
    }, [runId, fetchRunDetails]);

    const handleStatusChange = useCallback(() => {
        debouncedFetchRunDetails();
    }, [debouncedFetchRunDetails]);
    useRunStreaming({
        scope: 'TESTSUITE',
        runId: runId!,
        onStatusChange: handleStatusChange,
        onStepUpdate: handleStatusChange,
        onComplete: handleStatusChange,
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
            case 'ERROR': return <XCircle className="w-4 h-4 text-rose-500" />;
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

    const renderStatusBadge = (status: string, isAnyCaseActive: boolean) => {
        const s = (status.toUpperCase() === 'QUEUED' && isAnyCaseActive) ? 'RUNNING' : status.toUpperCase();

        const isSuccess = ['PASSED', 'SUCCESS', 'EXECUTED'].includes(s);
        const isFailure = ['FAILED', 'FAILURE'].includes(s);
        const isAborted = s === 'ABORTED';
        const isError = s === 'ERROR';
        const isRunningStatus = s === 'RUNNING';

        const colors = isSuccess ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50' :
            (isFailure || isError) ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-50' :
                isAborted ? 'bg-slate-100 text-slate-600 border-slate-200 shadow-slate-50' :
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
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden text-left">
                <TopNav />
                <div className="flex-1 flex flex-col items-center justify-center py-24 bg-white m-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
                    <p className="text-gray-500 font-bold font-sans tracking-wide uppercase text-sm">Syncing Test Cases...</p>
                </div>
            </div>
        );
    }
    if (error) return <div className="p-8"><ErrorMessage message={error} onClose={() => setError(null)} /></div>;
    if (!suiteRun) return <div className="p-8 text-center text-gray-500 font-bold">Run not found</div>;

    const isAnyCaseActive = suiteRun.testcase_runs.some(tr =>
        ['RUNNING', 'QUEUED', 'PENDING'].includes(tr.status?.toUpperCase() || '')
    );
    const isRunning = ['RUNNING', 'QUEUED', 'PENDING'].includes(suiteRun.status?.toUpperCase() || '') && isAnyCaseActive;

    return (
        <TestSuiteLayout
            error={error && <ErrorMessage message={error} onClose={() => setError(null)} />}
            header={
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="h-12 w-12 rounded-[1.25rem] bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-all hover:scale-105 active:scale-95 shrink-0"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-600" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight capitalize flex items-center gap-3">
                                {suiteRun.name || 'Test Suite Run'}
                                {suiteRun.status && renderStatusBadge(suiteRun.status, isAnyCaseActive)}
                            </h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    Execution Dashboard
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
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
            }
            searchBar={
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveView('cases')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${activeView === 'cases' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Test Cases
                        {activeView === 'cases' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(var(--primary-rgb),0.3)]" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveView('details')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${activeView === 'details' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <Info className="w-4 h-4" />
                        Run Details
                        {activeView === 'details' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(var(--primary-rgb),0.3)]" />
                        )}
                    </button>
                </div>
            }
            content={
                activeView === 'cases' ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="text-[10px] font-black text-gray-400 capitalize tracking-widest">
                                {suiteRun.testcase_runs.length} Cases in this Run
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-500">
                            <table className="w-full text-left font-sans">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            Case Name
                                        </th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            Duration
                                        </th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {suiteRun.testcase_runs.map((caseRun) => (
                                        <tr
                                            key={caseRun.id}
                                            onClick={() => navigate(`/project/${projectId}/suite/${suiteId}/case/${caseRun.testcase_id}/run/${caseRun.id}`)}
                                            className="hover:bg-primary/[0.02] cursor-pointer transition-all group"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                                                        <FileText className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900 group-hover:text-primary transition-all">
                                                            {caseRun.name || `Test Case Run #${caseRun.id}`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                {(() => {
                                                    const s = (caseRun.status || '').toUpperCase();
                                                    const isSuccess = ['PASSED', 'SUCCESS', 'EXECUTED'].includes(s);
                                                    const isFailure = ['FAILED', 'FAILURE'].includes(s);
                                                    const isError = s === 'ERROR';
                                                    const isRunningStatus = s === 'RUNNING';
                                                    const isAborted = s === 'ABORTED';

                                                    const colors = isSuccess ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50' :
                                                        (isFailure || isError) ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-50' :
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
                                            <td className="px-6 py-5 text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-300" />
                                                    {calculateDuration(caseRun.started_at, caseRun.finished_at)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
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
                ) : (
                    <RunDetailsView suiteRun={suiteRun} />
                )
            }
            modals={<></>}
        />
    );
};
