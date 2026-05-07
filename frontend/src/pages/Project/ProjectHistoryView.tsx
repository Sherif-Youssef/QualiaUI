import React, { useState, useEffect, useCallback } from 'react';
import {
    Clock,
    CheckCircle2,
    XCircle,
    PlayCircle,
    FileText,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { formatDate, parseUTCDate } from '@/utils/formatters';
import { runService } from '@/services/runService';
import { testSuiteService } from '@/services/testSuit/testSuiteService';
import { testCaseService } from '@/services/testCase/testCaseService';
import { useNavigate } from 'react-router-dom';

interface ProjectHistoryViewProps {
    projectId: string;
    isLoading: boolean;
}

interface UnifiedRun {
    id: number;
    type: 'SUITE' | 'CASE' | 'PROJECT';
    name: string;
    status: string;
    created_at: string;
    started_at: string | null;
    finished_at: string | null;
    targetId: string;
    suiteId: string;
    parentSuiteRunId?: number | null;
}

export const ProjectHistoryView: React.FC<ProjectHistoryViewProps> = ({
    projectId,
    isLoading: isProjectLoading
}) => {
    const navigate = useNavigate();
    const [unifiedRuns, setUnifiedRuns] = useState<UnifiedRun[]>([]);
    const [isLocalLoading, setIsLocalLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const fetchAllHistory = useCallback(async () => {
        if (!projectId) return;
        setIsLocalLoading(true);
        setError(null);
        setCurrentPage(1); // Reset to first page on refresh
        
        try {
            // 1. Fetch suites to resolve names
            const suitesRes = await testSuiteService.getTestSuites(projectId, 0, 50);
            const suites = suitesRes.testSuites;
            const suiteMap = new Map(suites.map(s => [String(s.id), s]));

            // 2. Fetch Suite runs and Case runs in parallel
            const historyPromises = suites.map(async (suite) => {
                try {
                    // Fetch suite runs
                    const sRunsRes = await runService.getTestSuiteRuns(projectId, suite.id, 0, 100);
                    const sRuns: UnifiedRun[] = sRunsRes.runs.map(r => ({
                        id: r.id,
                        type: 'SUITE' as const,
                        name: suite.name,
                        status: r.status,
                        created_at: r.created_at,
                        started_at: r.started_at,
                        finished_at: r.finished_at,
                        targetId: String(suite.id),
                        suiteId: String(suite.id)
                    }));

                    // Fetch cases for this suite to get their runs
                    const casesRes = await testCaseService.getTestCases(projectId, suite.id, 0, 20);
                    const testCases = casesRes.testCases;

                    const cRunsPromises = testCases.map(async (tc) => {
                        try {
                            const res = await runService.getTestCaseRuns(projectId, suite.id, tc.id, 0, 50);
                            // Only include standalone runs (no parent suite run)
                            return res.runs
                                .map(r => ({
                                    id: r.id,
                                    type: 'CASE' as const,
                                    name: `${suite.name} > ${tc.name}`,
                                    status: r.status,
                                    created_at: r.created_at,
                                    started_at: r.started_at,
                                    finished_at: r.finished_at,
                                    targetId: String(tc.id),
                                    suiteId: String(suite.id),
                                    parentSuiteRunId: r.testsuite_run_id
                                }));
                        } catch { return []; }
                    });

                    const cRunsResults = await Promise.all(cRunsPromises);
                    return [...sRuns, ...cRunsResults.flat()];
                } catch { return []; }
            });

            const allHistoryResults = await Promise.all(historyPromises);
            const allHistory = allHistoryResults.flat();

            // 3. Combine and Sort
            const combined = [...allHistory].sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            setUnifiedRuns(combined.slice(0, 500)); // Increase pool for pagination
        } catch (err: any) {
            console.error("History fetch error:", err);
            setError("Failed to load history");
        } finally {
            setIsLocalLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchAllHistory();
    }, [fetchAllHistory]);

    const calculateDuration = (startAt: string | null, endAt: string | null) => {
        if (!startAt || !endAt) return '--';
        const start = parseUTCDate(startAt)?.getTime() || 0;
        const end = parseUTCDate(endAt)?.getTime() || 0;
        const diffInSeconds = Math.floor((end - start) / 1000);
        return diffInSeconds < 60 ? `${diffInSeconds}s` : `${Math.floor(diffInSeconds / 60)}m ${diffInSeconds % 60}s`;
    };

    const getStatusStyles = (status: string) => {
        const s = (status || '').toUpperCase();
        if (['PASSED', 'SUCCESS', 'EXECUTED'].includes(s)) return 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50';
        if (['FAILED', 'FAILURE'].includes(s)) return 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-50';
        if (s === 'ERROR') return 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50';
        if (s === 'ABORTED') return 'bg-slate-100 text-slate-600 border-slate-200 shadow-slate-50';
        if (['RUNNING', 'QUEUED', 'PENDING'].includes(s)) return 'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-50';
        return 'bg-gray-50 text-gray-400 border-gray-100 shadow-gray-50';
    };

    const getStatusIcon = (status: string) => {
        const s = (status || '').toUpperCase();
        if (['PASSED', 'SUCCESS', 'EXECUTED'].includes(s)) return <CheckCircle2 className="w-3.5 h-3.5" />;
        if (['FAILED', 'FAILURE'].includes(s)) return <XCircle className="w-3.5 h-3.5" />;
        if (s === 'ERROR') return <AlertCircle className="w-3.5 h-3.5" />;
        if (['RUNNING', 'QUEUED', 'PENDING'].includes(s)) return <PlayCircle className="w-3.5 h-3.5 animate-pulse" />;
        return <Clock className="w-3.5 h-3.5" />;
    };

    const handleRowClick = (run: UnifiedRun) => {
        if (run.type === 'SUITE' || run.type === 'PROJECT') {
            const path = run.type === 'PROJECT' 
                ? `/project/${projectId}/run/${run.id}`
                : `/project/${projectId}/suite/${run.suiteId}/run/${run.id}`;
            navigate(path);
        } else {
            navigate(`/project/${projectId}/suite/${run.suiteId}/case/${run.targetId}/run`, {
                state: { runId: run.id, parentSuiteRunId: run.parentSuiteRunId }
            });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex justify-end mb-4">
                <button 
                    onClick={fetchAllHistory}
                    disabled={isLocalLoading}
                    className="p-2.5 rounded-xl bg-white border border-gray-100 shadow-sm text-gray-400 hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all disabled:opacity-50"
                    title="Refresh"
                >
                    <RefreshCw className={`w-5 h-5 ${isLocalLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-bold">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            ) }

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-8 py-6 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Status</th>
                            <th className="px-8 py-6 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Run ID</th>
                            <th className="px-8 py-6 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Date & Time</th>
                            <th className="px-8 py-6 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Duration</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {(isLocalLoading && unifiedRuns.length === 0) ? (
                            Array(10).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={4} className="px-8 py-6">
                                        <div className="h-12 bg-gray-50 rounded-2xl w-full"></div>
                                    </td>
                                </tr>
                            ))
                        ) : unifiedRuns.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-32 text-center">
                                    <div className="flex flex-col items-center gap-4 text-gray-300">
                                        <div className="w-20 h-20 rounded-[2.5rem] bg-gray-50 flex items-center justify-center">
                                            <FileText className="w-10 h-10 opacity-20" />
                                        </div>
                                        <p className="text-lg font-black tracking-tight">No Execution History</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            unifiedRuns
                                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                .map((run) => (
                                <tr
                                    key={`${run.type}-${run.id}`}
                                    onClick={() => handleRowClick(run)}
                                    className="hover:bg-gray-50/80 transition-all cursor-pointer group"
                                >
                                    <td className="px-8 py-6">
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm w-fit text-[10px] font-black uppercase tracking-wider transition-all duration-300 group-hover:scale-105 ${getStatusStyles(run.status)}`}>
                                            {getStatusIcon(run.status)}
                                            {run.status}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-base font-black text-gray-800 tracking-tight group-hover:text-primary transition-colors">Run #{run.id}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[250px]">
                                                {run.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold text-gray-500">{formatDate(run.created_at)}</td>
                                    <td className="px-8 py-6 text-sm font-bold text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 opacity-30" />
                                            {calculateDuration(run.started_at, run.finished_at)}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {unifiedRuns.length > pageSize && (
                    <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Page {currentPage} of {Math.ceil(unifiedRuns.length / pageSize)}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:border-primary hover:text-primary disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-all bg-white shadow-sm"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(unifiedRuns.length / pageSize), p + 1))}
                                disabled={currentPage === Math.ceil(unifiedRuns.length / pageSize)}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:border-primary hover:text-primary disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-all bg-white shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
