import React from 'react';
import { 
    Calendar, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    AlertCircle,
    ChevronRight 
} from 'lucide-react';
import { ProjectRun } from '@/services/runService';

interface ProjectHistoryTableProps {
    runs: ProjectRun[];
    onView?: (id: number) => void;
}

export const ProjectHistoryTable: React.FC<ProjectHistoryTableProps> = ({ runs, onView }) => {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PASSED': return <CheckCircle2 className="w-5 h-5 text-success" />;
            case 'FAILED': return <XCircle className="w-5 h-5 text-failure" />;
            case 'ABORTED': return <AlertCircle className="w-5 h-5 text-warning" />;
            default: return <Clock className="w-5 h-5 text-primary" />;
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50/80 border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest font-sans">Status</th>
                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest font-sans">Run Identity</th>
                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest font-sans">Execution Timeline</th>
                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest font-sans">Session Mode</th>
                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest font-sans text-right">Control</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {runs.map((run) => (
                            <tr 
                                key={run.id} 
                                className="group hover:bg-gray-50/50 transition-all cursor-pointer"
                                onClick={() => onView?.(run.id)}
                            >
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(run.status)}
                                        <span className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-lg ${
                                            run.status === 'PASSED' ? 'bg-success/10 text-success' :
                                            run.status === 'FAILED' ? 'bg-failure/10 text-failure' :
                                            run.status === 'ABORTED' ? 'bg-warning/10 text-warning' :
                                            'bg-muted text-gray-600'
                                        }`}>
                                            {run.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-base font-bold text-gray-800 group-hover:text-primary transition-colors">Run #{run.id}</span>
                                        <span className="text-xs font-medium text-gray-400 truncate max-w-[250px] font-mono">{run.job_uid}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 whitespace-nowrap">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                            {new Date(run.started_at || run.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 tracking-wider">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(run.started_at || run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 whitespace-nowrap">
                                    <span className="text-[10px] font-black tracking-widest text-gray-400 bg-muted px-3 py-1.5 rounded-xl uppercase">
                                        {run.mode}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                        <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
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
