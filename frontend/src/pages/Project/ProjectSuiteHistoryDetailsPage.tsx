import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRunStreaming } from '@/hooks/useRunStreaming';
import { runService } from '@/services/runService';
import { TestSuiteRun, TestCaseRun } from '@/types/run';
import { parseUTCDate } from '@/utils/formatters';
import { ErrorMessage } from '@/components/GeneralComponents';
import { TestSuiteManagerLoading } from '../TestSuiteManager/TestSuiteManagerLoading';
import { CheckCircle2, XCircle, AlertCircle, ChevronLeft, ArrowRight, Clock, FileText, StopCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopNav } from '@/components/TopNav';
import { projectService } from '@/services/project/projectService';
import { Project } from '@/types/project';

export const ProjectSuiteHistoryDetailsPage: React.FC = () => {
    const { projectId, runId, suiteRunId } = useParams<{ projectId: string; runId: string; suiteRunId: string }>();
    const navigate = useNavigate();
    const [suiteRun, setSuiteRun] = useState<(TestSuiteRun & { testcase_runs: TestCaseRun[] }) | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAborting, setIsAborting] = useState(false);

    const fetchSuiteDetails = useCallback(async () => {
        if (!suiteRunId) return;
        try {
            const id = parseInt(suiteRunId);
            const data = await runService.getTestSuiteRunDetails(id);
            setSuiteRun(data);
        } catch (err: any) {
            console.error('Suite history details error:', err);
            setError(err.response?.data?.detail || 'Failed to load suite run details.');
        } finally {
            setIsLoading(false);
        }
    }, [suiteRunId]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([
                fetchSuiteDetails(),
                projectId ? projectService.getProjectById(projectId).then(setProject).catch(console.error) : Promise.resolve()
            ]);
            setIsLoading(false);
        };
        loadData();
    }, [suiteRunId, projectId]);

    const handleStatusChange = useCallback(() => {
        setTimeout(() => {
            fetchSuiteDetails();
        }, 500);
    }, [fetchSuiteDetails]);

    useRunStreaming({
        scope: runId === 'standalone' ? 'TESTSUITE' : 'PROJECT',
        runId: runId === 'standalone' ? suiteRunId! : runId!,
        onStatusChange: handleStatusChange,
        onStepUpdate: handleStatusChange
    });

    const handleAbortSuite = async () => {
        if (!suiteRunId) return;
        setIsAborting(true);
        try {
            await runService.abortTestSuiteRun(parseInt(suiteRunId));
        } catch (err: any) {
            console.error('Abort suite error:', err);
            setError(err.response?.data?.detail || 'Failed to abort suite run.');
            setIsAborting(false);
        }
    };

    const getStatusIcon = (status: string) => {
        const s = status.toUpperCase();
        switch (s) {
            case 'PASSED':
            case 'EXECUTED': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'FAILED': return <XCircle className="w-5 h-5 text-rose-500" />;
            case 'ERROR': return <AlertCircle className="w-5 h-5 text-amber-500" />;
            case 'RUNNING': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
            default: return <Clock className="w-5 h-5 text-gray-400" />;
        }
    };

    const calculateDuration = (startAt: string | null, endAt: string | null) => {
        if (!startAt || !endAt) return 'Unknown';
        const start = parseUTCDate(startAt)?.getTime() || 0;
        const end = parseUTCDate(endAt)?.getTime() || 0;
        const diffInSeconds = Math.floor((end - start) / 1000);
        if (diffInSeconds < 60) return `${diffInSeconds}s`;
        return `${Math.floor(diffInSeconds / 60)}m ${diffInSeconds % 60}s`;
    };

    if (isLoading) return <TestSuiteManagerLoading />;
    if (error) return <div className="p-8"><ErrorMessage message={error} /></div>;
    if (!suiteRun) return <div className="p-8 text-center text-gray-500 font-bold">Suite run not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 text-left font-sans">
            <TopNav />
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
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
                                        {project && (
                                            <span className="text-primary/40 mr-2">{project.name} /</span>
                                        )}
                                        {suiteRun.name || 'Test Suite Run'}
                                    </div>
                                    {suiteRun.status && (() => {
                                        const s = suiteRun.status.toUpperCase();
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
                                                    {suiteRun.status}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </h1>
                                <div className="flex items-center gap-3 mt-1">

                                    <span className="text-xs font-bold text-gray-400 capitalize tracking-widest">
                                        {parseUTCDate(suiteRun.created_at)?.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {suiteRun.status?.toUpperCase() === 'RUNNING' && (
                            <Button
                                onClick={handleAbortSuite}
                                disabled={isAborting}
                                variant="destructive"
                                className="h-11 px-6 rounded-xl font-bold shadow-lg shadow-red-200 flex items-center gap-2 transition-all active:scale-95"
                            >
                                <StopCircle className="w-5 h-5" />
                                {isAborting ? 'Aborting...' : 'Abort Run'}
                            </Button>
                        )}
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight capitalize">Test Cases</h2>
                            </div>
                            <div className="text-[10px] font-black text-gray-400 capitalize tracking-widest">
                                {suiteRun.testcase_runs.length} Cases Executed
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
                                            onClick={() => navigate(`/project/${projectId}/suite/${suiteRun?.testsuite_id}/case/${caseRun.testcase_id}/manager`, {
                                                state: { runId: suiteRun?.id, scope: 'TESTSUITE' }
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
                                                <div className="flex items-center justify-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-100 shadow-sm mx-auto w-fit">
                                                    {getStatusIcon(caseRun.status)}
                                                    <span className="text-[10px] font-black text-gray-500 capitalize tracking-widest">
                                                        {caseRun.status}
                                                    </span>
                                                </div>
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
