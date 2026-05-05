import { CheckCircle, XCircle, Clock, Calendar, Loader2, StopCircle, AlertCircle } from 'lucide-react';
import { ProjectRun, TestSuiteRun, TestCaseRun } from '@/types/run';
import { parseUTCDate } from '@/utils/formatters';

interface RunHistoryTableProps {
    runs: (ProjectRun | TestSuiteRun | TestCaseRun)[];
    isLoading: boolean;
    onViewDetails?: (run: any) => void;
}

export const RunHistoryTable: React.FC<RunHistoryTableProps> = ({ runs, isLoading, onViewDetails }) => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Loading history...</p>
            </div>
        );
    }

    if (runs.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium text-lg mb-1">No run history found</p>
                <p className="text-gray-400">Run some tests to see the history here.</p>
            </div>
        );
    }

    const formatDate = (dateStr: string | null) => {
        const date = parseUTCDate(dateStr);
        if (!date) return '-';
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const getStatusStyles = (status: string) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'PASSED':
            case 'SUCCESS':
            case 'EXECUTED':
                return {
                    bg: 'bg-emerald-50',
                    text: 'text-emerald-700',
                    border: 'border-emerald-100',
                    icon: <CheckCircle className="w-4 h-4" />
                };
            case 'FAILED':
            case 'FAILURE':
                return {
                    bg: 'bg-rose-50',
                    text: 'text-rose-700',
                    border: 'border-rose-100',
                    icon: <XCircle className="w-4 h-4" />
                };
            case 'ERROR':
                return {
                    bg: 'bg-amber-50',
                    text: 'text-amber-700',
                    border: 'border-amber-100',
                    icon: <AlertCircle className="w-4 h-4" />
                };
            case 'ABORTED':
                return {
                    bg: 'bg-slate-100',
                    text: 'text-slate-600',
                    border: 'border-slate-200',
                    icon: <StopCircle className="w-4 h-4" />
                };
            case 'RUNNING':
                return {
                    bg: 'bg-blue-50',
                    text: 'text-blue-700',
                    border: 'border-blue-100',
                    icon: <Loader2 className="w-4 h-4 animate-spin" />
                };
            case 'QUEUED':
            case 'PENDING':
                return {
                    bg: 'bg-indigo-50',
                    text: 'text-indigo-600',
                    border: 'border-indigo-100',
                    icon: <Clock className="w-4 h-4" />
                };
            default:
                return {
                    bg: 'bg-gray-50',
                    text: 'text-gray-600',
                    border: 'border-gray-100',
                    icon: <Clock className="w-4 h-4" />
                };
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Run Identity</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-center">Execution Timeline</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-right">Duration</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {runs.map((run) => {
                            const statusStyle = getStatusStyles(run.status);
                            const start = parseUTCDate(run.started_at);
                            const finish = parseUTCDate(run.finished_at);

                            let duration = '-';
                            if (start && finish) {
                                const durationSeconds = Math.floor((finish.getTime() - start.getTime()) / 1000);
                                duration = durationSeconds > 60
                                    ? `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`
                                    : `${durationSeconds}s`;
                            } else if (start && run.status === 'RUNNING') {
                                duration = 'In progress...';
                            }

                            const idStr = String(run.id);

                            return (
                                <tr
                                    key={idStr}
                                    className="hover:bg-primary/[0.02] transition-all cursor-pointer group"
                                    onClick={() => onViewDetails?.(run)}
                                >
                                    <td className="px-8 py-6">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} text-[10px] font-black tracking-widest uppercase`}>
                                            {statusStyle.icon}
                                            {run.status}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">Run #{idStr}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-2 text-[11px] font-black text-gray-700">
                                                <Calendar className="w-3.5 h-3.5 text-gray-300" />
                                                {formatDate(run.started_at || run.created_at).split(',')[0]}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                                <Clock className="w-3.5 h-3.5 text-gray-200" />
                                                {formatDate(run.started_at || run.created_at).split(',')[1]}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <span className="text-xs font-black text-gray-500 tabular-nums">
                                            {duration}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

