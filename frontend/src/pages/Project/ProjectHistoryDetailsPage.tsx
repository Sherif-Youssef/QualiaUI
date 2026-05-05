import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRunStreaming } from '@/hooks/useRunStreaming';
import { runService } from '@/services/runService';
import { ProjectRun, TestSuiteRun } from '@/types/run';
import { parseUTCDate } from '@/utils/formatters';
import { ErrorMessage } from '@/components/GeneralComponents';
import { TestSuiteManagerLoading } from '../TestSuiteManager/TestSuiteManagerLoading';
import { CheckCircle2, XCircle, ChevronLeft, Layers, ArrowRight, Clock, StopCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopNav } from '@/components/TopNav';
import { projectService } from '@/services/project/projectService';
import { Project } from '@/types/project';

export const ProjectHistoryDetailsPage: React.FC = () => {
    const { projectId, runId } = useParams<{ projectId: string; runId: string }>();
    const navigate = useNavigate();
    const [run, setRun] = useState<(ProjectRun & { testsuite_runs: TestSuiteRun[] }) | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAborting, setIsAborting] = useState(false);

    const fetchHistoryDetails = useCallback(async () => {
        if (!projectId || !runId) return;
        try {
            const id = parseInt(runId);
            const runData = await runService.getProjectRunDetails(id);
            setRun(runData);
        } catch (err: any) {
            console.error('History details error:', err);
            setError(err.response?.data?.detail || 'Failed to load historical details.');
        } finally {
            setIsLoading(false);
        }
    }, [projectId, runId]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([
                fetchHistoryDetails(),
                projectId ? projectService.getProjectById(projectId).then(setProject).catch(() => {}) : Promise.resolve()
            ]);
            setIsLoading(false);
        };
        loadData();
    }, [projectId, runId]);

    const handleStatusChange = useCallback(() => {
        fetchHistoryDetails();
    }, [fetchHistoryDetails]);

    useRunStreaming({
        scope: 'PROJECT',
        runId: runId!,
        onStatusChange: handleStatusChange
    });

    const handleAbortProject = async () => {
        if (!runId) return;
        setIsAborting(true);
        try {
            await runService.abortProjectRun(parseInt(runId));
        } catch (err: any) {
            console.error('Abort project error:', err);
            setError(err.response?.data?.detail || 'Failed to abort project run.');
            setIsAborting(false);
        }
    };
    const getDuration = (startAt?: string | null, endAt?: string | null) => {
        if (!startAt || !endAt) return 'N/A';
        const start = parseUTCDate(startAt)?.getTime() || 0;
        const end = parseUTCDate(endAt)?.getTime() || 0;
        const diff = Math.abs(end - start) / 1000;
        const minutes = Math.floor(diff / 60);
        const seconds = Math.floor(diff % 60);
        return `${minutes}m ${seconds}s`;
    };

    if (isLoading) return <TestSuiteManagerLoading />;
    if (error) return <div className="p-8"><ErrorMessage message={error} /></div>;
    if (!run) return <div className="p-8 text-center text-gray-500 font-bold">Run not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 text-left font-sans">
            <TopNav />
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
                <div className="space-y-8">
                    {/* Header */}
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
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-4">
                                    {project ? project.name : 'Project Run Details'}
                                    {run.status && (() => {
                                        const s = run.status.toUpperCase();
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
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm ${colors} text-sm normal-case`}>
                                                {isSuccess && <CheckCircle2 className="w-4 h-4" />}
                                                {isFailure && <XCircle className="w-4 h-4" />}
                                                {isAborted && <StopCircle className="w-4 h-4" />}
                                                {isError && <AlertCircle className="w-4 h-4" />}
                                                {isRunning && <Loader2 className="w-4 h-4 animate-spin" />}
                                                {isQueued && <Clock className="w-3.5 h-3.5" />}
                                                <span className="text-[10px] font-black uppercase tracking-wider">
                                                    {run.status}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </h1>
                                <div className="flex items-center gap-3 mt-1">

                                    <span className="text-xs font-bold text-gray-400 capitalize tracking-widest">
                                        {parseUTCDate(run.started_at || run.created_at)?.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {run.status?.toUpperCase() === 'RUNNING' && (
                            <Button
                                onClick={handleAbortProject}
                                disabled={isAborting}
                                variant="destructive"
                                className="h-11 px-6 rounded-xl font-bold shadow-lg shadow-red-200 flex items-center gap-2 transition-all active:scale-95"
                            >
                                <StopCircle className="w-5 h-5" />
                                {isAborting ? 'Aborting...' : 'Abort Run'}
                            </Button>
                        )}
                    </div>

                    {/* Suites Table - Projects Page Style */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Layers className="w-5 h-5 text-primary" />
                                </div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight capitalize">Test Suites</h2>
                            </div>
                            <div className="text-[10px] font-black text-gray-400 capitalize tracking-widest">
                                {run.testsuite_runs.length} Suites Executed
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden transition-all duration-500">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 capitalize tracking-widest">
                                            Suite Name
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
                                    {run.testsuite_runs.map((suiteRun) => (
                                        <tr
                                            key={suiteRun.id}
                                            onClick={() => navigate(`/project/${projectId}/suite/${suiteRun.testsuite_id}/run/${suiteRun.id}`)}
                                            className="hover:bg-gray-50/50 cursor-pointer transition-all group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                                                        <Layers className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-gray-900 group-hover:text-primary transition-all">
                                                            {suiteRun.name || `Suite Run #${suiteRun.id}`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                {(() => {
                                                    const s = suiteRun.status?.toUpperCase();
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
                                                        <div className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border shadow-sm mx-auto w-fit transition-all ${colors}`}>
                                                            {isSuccess && <CheckCircle2 className="w-4 h-4" />}
                                                            {isFailure && <XCircle className="w-4 h-4" />}
                                                            {isAborted && <StopCircle className="w-4 h-4" />}
                                                            {isError && <AlertCircle className="w-4 h-4" />}
                                                            {isRunning && <Loader2 className="w-4 h-4 animate-spin" />}
                                                            {isQueued && <Clock className="w-3.5 h-3.5" />}
                                                            <span className="text-[10px] font-black uppercase tracking-wider">
                                                                {suiteRun.status}
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-8 py-6 text-center text-[11px] font-black text-gray-400 capitalize tracking-widest">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-300" />
                                                    {getDuration(suiteRun.started_at, suiteRun.finished_at)}
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
