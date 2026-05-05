import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    History,
    ChevronLeft,
} from 'lucide-react';
import { runService } from '@/services/runService';
import { ProjectRun } from '@/types/run';
import { ProjectLayout } from './ProjectLayout';
import { ErrorMessage } from '@/components/GeneralComponents';
import { Pagination } from '@/components/Pagination';
import { ProjectHistoryTable } from './ProjectHistoryTable';
import { ProjectHistoryEmptyState } from './ProjectHistoryEmptyState';

export const ProjectHistoryPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();

    const [runs, setRuns] = useState<ProjectRun[]>([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const limit = 10;

    const fetchHistory = React.useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        setError(null);
        try {
            const offset = (currentPage - 1) * limit;
            const data = await runService.getProjectRuns(projectId, offset, limit);
            setRuns(data.runs);
            setTotal(data.total);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to fetch run history.');
        } finally {
            setIsLoading(false);
        }
    }, [projectId, currentPage]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    return (
        <ProjectLayout
            header={
                <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-4">
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
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-sans font-bold text-gray-800 tracking-tight uppercase flex items-center gap-2">
                                <History className="w-6 h-6 text-primary" />
                                Execution History
                            </h2>
                            <p className="text-sm font-medium text-gray-400 font-sans">View and manage past test results</p>
                        </div>
                    </div>
                </div>
            }
            content={
                <div className="animate-in fade-in duration-500">
                    {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
                            <p className="text-gray-500 font-bold font-sans tracking-wide uppercase text-sm">Synchronizing History Archives...</p>
                        </div>
                    ) : runs.length === 0 ? (
                        <ProjectHistoryEmptyState onRunTests={() => navigate(`/project/${projectId}`)} />
                    ) : (
                        <ProjectHistoryTable
                            runs={runs}
                            onView={(id) => navigate(`/project/${projectId}/history/${id}`)}
                        />
                    )}
                </div>
            }
            pagination={total > limit && (
                <div className="pt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(total / limit)}
                        itemsPerPage={limit}
                        totalItems={total}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        />
    );
};
