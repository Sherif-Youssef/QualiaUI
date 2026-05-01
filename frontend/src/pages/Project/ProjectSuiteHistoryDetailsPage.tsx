import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { runService, TestSuiteRun, TestCaseRun } from '@/services/runService';
import { ErrorMessage } from '@/components/GeneralComponents';
import { TestSuiteManagerLoading } from '../TestSuiteManager/TestSuiteManagerLoading';
import { CheckCircle2, XCircle, AlertCircle, ChevronLeft, ArrowRight, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ProjectSuiteHistoryDetailsPage: React.FC = () => {
    const { projectId, runId, suiteRunId } = useParams<{ projectId: string; runId: string; suiteRunId: string }>();
    const navigate = useNavigate();
    const [suiteRun, setSuiteRun] = useState<(TestSuiteRun & { testcase_runs: TestCaseRun[] }) | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSuiteDetails = async () => {
            if (!suiteRunId) return;
            setIsLoading(true);
            setError(null);
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
        };

        fetchSuiteDetails();
    }, [suiteRunId]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PASSED': return <CheckCircle2 className="w-5 h-5 text-success" />;
            case 'FAILED': return <XCircle className="w-5 h-5 text-failure" />;
            default: return <AlertCircle className="w-5 h-5 text-warning" />;
        }
    };

    const getDuration = (startAt?: string | null, endAt?: string | null) => {
        if (!startAt || !endAt) return 'N/A';
        const start = new Date(startAt).getTime();
        const end = new Date(endAt).getTime();
        const diff = Math.abs(end - start) / 1000;
        const minutes = Math.floor(diff / 60);
        const seconds = Math.floor(diff % 60);
        return `${minutes}m ${seconds}s`;
    };

    if (isLoading) return <TestSuiteManagerLoading />;
    if (error) return <div className="p-8"><ErrorMessage message={error} /></div>;
    if (!suiteRun) return <div className="p-8 text-center text-gray-500 font-bold">Suite run not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 text-left font-sans">
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    if (runId === 'standalone' && suiteRun?.testsuite_id) {
                                        navigate(`/project/${projectId}/suite/${suiteRun.testsuite_id}`);
                                    } else {
                                        navigate(`/project/${projectId}/history/${runId}`);
                                    }
                                }}
                                className="h-12 w-12 rounded-[1.25rem] bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-all hover:scale-105 active:scale-95"
                            >
                                <ChevronLeft className="w-6 h-6 text-gray-600" />
                            </Button>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight capitalize truncate max-w-2xl">
                                    {runId !== 'standalone' && (
                                        <span className="text-primary/40 mr-2">Run #{runId} /</span>
                                    )}
                                    {suiteRun.name || 'Test Suite Run'}
                                </h1>
                                <div className="flex items-center gap-3 mt-1">

                                    <span className="text-xs font-bold text-gray-400 capitalize tracking-widest">
                                        {new Date(suiteRun.created_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cases Table - Projects Page Style */}
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
                                            onClick={() => navigate(`/project/${projectId}/history/${runId}/suite/${suiteRunId}/case/${caseRun.id}`)}
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
                                                        <span className="text-[10px] font-bold text-gray-400 capitalize tracking-widest mt-1">
                                                            ID: {caseRun.id}
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
                                                    {getDuration(caseRun.started_at, caseRun.finished_at)}
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
