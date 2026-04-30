import React from 'react';
import { History, Calendar, Clock, ChevronRight, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { TestCaseRun } from '@/services/runService';

interface TestRunHistoryTableProps {
    history: TestCaseRun[];
    projectId: string;
    onRunClick: (run: TestCaseRun) => void;
}

export const TestRunHistoryTable: React.FC<TestRunHistoryTableProps> = ({ history, onRunClick }) => {
    const getStatusIcon = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'passed':
            case 'success': return <CheckCircle2 className="w-5 h-5 text-success" />;
            case 'failed':
            case 'failure': return <XCircle className="w-5 h-5 text-failure" />;
            default: return <AlertCircle className="w-5 h-5 text-warning" />;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <History className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight capitalize">Run History</h2>
                </div>
                <div className="text-[10px] font-black text-gray-400 capitalize tracking-widest">
                    Last {history.length} executions
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden transition-all duration-500">
                <table className="w-full">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 capitalize tracking-widest">
                                Run Identity
                            </th>
                            <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 capitalize tracking-widest">
                                Status
                            </th>
                            <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 capitalize tracking-widest">
                                Timeline
                            </th>
                            <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 capitalize tracking-widest">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {history.map((run) => (
                            <tr
                                key={run.id}
                                onClick={() => onRunClick(run)}
                                className="hover:bg-gray-50/50 cursor-pointer transition-all group"
                            >
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                                            <History className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-gray-900 group-hover:text-primary transition-all">
                                                Run #{run.id}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400 capitalize tracking-widest mt-1 font-mono">
                                                {run.job_uid ? `${run.job_uid.slice(0, 8)}...` : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className="flex items-center justify-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-100 shadow-sm mx-auto w-fit">
                                        {getStatusIcon(run.status)}
                                        <span className="text-[10px] font-black text-gray-500 capitalize tracking-widest">
                                            {run.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="flex items-center gap-2 text-[11px] font-black text-gray-700">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                            {new Date(run.started_at || run.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            {run.started_at ? new Date(run.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
