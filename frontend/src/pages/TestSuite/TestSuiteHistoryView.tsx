import React, { useState, useEffect, useCallback } from 'react';
import {
    Clock,
    CheckCircle2,
    XCircle,
    PlayCircle,
    RefreshCw,
    AlertCircle,
    FileText
} from 'lucide-react';
import { formatDate, parseUTCDate } from '@/utils/formatters';
import { runService } from '@/services/runService';
import { useNavigate } from 'react-router-dom';
import { TestSuiteRun } from '@/types/run';
import { Pagination } from '@/components/Pagination';

interface TestSuiteHistoryViewProps {
    projectId: string;
    suiteId: string;
}

export const TestSuiteHistoryView: React.FC<TestSuiteHistoryViewProps> = ({
    projectId,
    suiteId
}) => {
    const navigate = useNavigate();
    const [runs, setRuns] = useState<TestSuiteRun[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 10;

    const fetchHistory = useCallback(async () => {
        if (!projectId || !suiteId) return;
        setIsLoading(true);
        setError(null);

        try {
            const offset = (currentPage - 1) * pageSize;
            const res = await runService.getTestSuiteRuns(projectId, suiteId, offset, pageSize);
            setRuns(res.runs);
            setTotalItems(res.total);
        } catch (err: any) {
            console.error("History fetch error:", err);
            setError("Failed to load history");
        } finally {
            setIsLoading(false);
        }
    }, [projectId, suiteId, currentPage]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const calculateDuration = (startAt: string | null, endAt: string | null) => {
        if (!startAt || !endAt) return '--';
        const start = parseUTCDate(startAt)?.getTime() || 0;
        const end = parseUTCDate(endAt)?.getTime() || 0;
        const diffInSeconds = Math.floor((end - start) / 1000);
        return diffInSeconds < 60 ? `${diffInSeconds}s` : `${Math.floor(diffInSeconds / 60)}m ${diffInSeconds % 60}s`;
    };

    const getStatusStyles = (status: string) => {
        const s = (status || '').toUpperCase();
        if (['PASSED', 'SUCCESS', 'EXECUTED'].includes(s)) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (['FAILED', 'FAILURE'].includes(s)) return 'bg-rose-50 text-rose-600 border-rose-100';
        if (s === 'ERROR') return 'bg-amber-50 text-amber-600 border-amber-100';
        if (s === 'ABORTED') return 'bg-slate-100 text-slate-600 border-slate-200';
        if (['RUNNING', 'QUEUED', 'PENDING'].includes(s)) return 'bg-blue-50 text-blue-600 border-blue-100';
        return 'bg-gray-50 text-gray-400 border-gray-100';
    };

    const getStatusIcon = (status: string) => {
        const s = (status || '').toUpperCase();
        if (['PASSED', 'SUCCESS', 'EXECUTED'].includes(s)) return <CheckCircle2 className="w-3 h-3" />;
        if (['FAILED', 'FAILURE'].includes(s)) return <XCircle className="w-3 h-3" />;
        if (s === 'ERROR') return <AlertCircle className="w-3 h-3" />;
        if (['RUNNING', 'QUEUED', 'PENDING'].includes(s)) return <PlayCircle className="w-3 h-3 animate-pulse" />;
        return <Clock className="w-3 h-3" />;
    };

    const handleRowClick = (runId: number) => {
        navigate(`/project/${projectId}/suite/${suiteId}/run/${runId}`);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex justify-end mb-4">
                <button
                    onClick={fetchHistory}
                    disabled={isLoading}
                    className="p-2 text-gray-400 hover:text-primary transition-all active:scale-90"
                    title="Refresh History"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-bold">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left font-sans">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Run Details</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Date & Time</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Duration</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {(isLoading && runs.length === 0) ? (
                            Array(pageSize).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={4} className="px-6 py-5">
                                        <div className="h-8 bg-gray-50 rounded-lg w-full"></div>
                                    </td>
                                </tr>
                            ))
                        ) : runs.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-3 text-gray-300">
                                        <FileText className="w-8 h-8 opacity-20" />
                                        <p className="text-sm font-bold tracking-tight">No Execution History</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            runs.map((run) => (
                                <tr
                                    key={run.id}
                                    onClick={() => handleRowClick(run.id)}
                                    className="hover:bg-primary/[0.02] cursor-pointer group transition-all duration-200"
                                >
                                    <td className="px-6 py-5">
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm w-fit text-[10px] font-black uppercase tracking-wider ${getStatusStyles(run.status)}`}>
                                            {getStatusIcon(run.status)}
                                            {run.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                                                Run #{run.id}
                                            </span>
                                            <span className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[200px]">
                                                {run.name || 'TestSuite Execution'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm font-bold text-gray-600">
                                            {formatDate(run.created_at)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                                            <Clock className="w-3.5 h-3.5 opacity-30" />
                                            {calculateDuration(run.started_at, run.finished_at)}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalItems > pageSize && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalItems / pageSize)}
                    itemsPerPage={pageSize}
                    totalItems={totalItems}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    );
};
