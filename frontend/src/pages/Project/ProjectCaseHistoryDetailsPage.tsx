import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { runService } from '@/services/runService';
import { TestCaseRun, TestStepRun, TestSuiteRun } from '@/types/run';
import { ErrorMessage } from '@/components/GeneralComponents';
import { TestSuiteManagerLoading } from '../TestSuiteManager/TestSuiteManagerLoading';
import { Globe, CheckCircle2, XCircle, StopCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { TestCaseDetailsLayout } from '../TestCaseDetails/TestCaseDetailsLayout';
import { ScreenshotViewer } from '../TestCaseDetails/ScreenshotViewer';
import { TestRunStepsSidebar } from './components/TestRunStepsSidebar';
import { formatAction } from '@/utils/formatters';
import { useRunStreaming } from '@/hooks/useRunStreaming';
import { projectService } from '@/services/project/projectService';
import { Project } from '@/types/project';

export const ProjectCaseHistoryDetailsPage: React.FC = () => {
    const { projectId, runId, suiteRunId, caseRunId } = useParams<{
        projectId: string;
        runId: string;
        suiteRunId: string;
        caseRunId: string;
    }>();
    const navigate = useNavigate();
    const [caseRun, setCaseRun] = useState<(TestCaseRun & { teststep_runs: TestStepRun[] }) | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [suiteRun, setSuiteRun] = useState<TestSuiteRun | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
    const [zoomLevel, setZoomLevel] = useState(100);

    const fetchCaseDetails = useCallback(async () => {
        if (!caseRunId) return;
        try {
            const id = parseInt(caseRunId);
            const data = await runService.getTestCaseRunDetails(id);
            setCaseRun(data);
            if (data.teststep_runs?.length > 0 && selectedStepId === null) {
                setSelectedStepId(data.teststep_runs[data.teststep_runs.length - 1].id);
            }
        } catch (err: any) {
            console.error('Case history details error:', err);
            setError(err.response?.data?.detail || 'Failed to load case run details.');
        } finally {
            setIsLoading(false);
        }
    }, [caseRunId, selectedStepId]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([
                fetchCaseDetails(),
                projectId ? projectService.getProjectById(projectId).then(setProject).catch(() => {}) : Promise.resolve(),
                suiteRunId && suiteRunId !== 'standalone' ? runService.getTestSuiteRunDetails(parseInt(suiteRunId)).then(setSuiteRun).catch(() => {}) : Promise.resolve()
            ]);
            setIsLoading(false);
        };
        loadData();
    }, [caseRunId, projectId, suiteRunId]);

    const handleStatusChange = useCallback(() => {
        fetchCaseDetails();
    }, [fetchCaseDetails]);

    useRunStreaming({
        scope: runId === 'standalone' ? 'TESTSUITE' : 'PROJECT',
        runId: runId === 'standalone' ? suiteRunId! : runId!,
        onStatusChange: handleStatusChange,
        onStepUpdate: handleStatusChange
    });
    useEffect(() => {
        if (caseRun?.status === 'RUNNING' && caseRun.teststep_runs?.length > 0) {
            const latestStepId = caseRun.teststep_runs[caseRun.teststep_runs.length - 1].id;
            setSelectedStepId(latestStepId);
        }
    }, [caseRun?.teststep_runs?.length, caseRun?.status]);

    const selectedStep = caseRun?.teststep_runs?.find(s => s.id === selectedStepId);

    if (isLoading) return <TestSuiteManagerLoading />;
    if (error) return <div className="p-8"><ErrorMessage message={error} /></div>;
    if (!caseRun) return <div className="p-8 text-center text-gray-500 font-bold">Case run not found</div>;

    const renderSidebar = () => (
        <TestRunStepsSidebar
            caseName={caseRun.name || 'Test Case'}
            steps={caseRun.teststep_runs || []}
            selectedStepId={selectedStepId}
            onSelectStep={setSelectedStepId}
            terminationReason={caseRun.termination_reason}
            status={caseRun.status}
            onBack={() => navigate(-1)}
        />
    );

    const renderContent = () => (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="h-16 bg-white border-b border-gray-100 flex items-center px-8 gap-4 shrink-0">
                {runId !== 'standalone' && (
                    <>
                        <span className="text-sm font-black text-gray-400 uppercase tracking-widest">
                            {project ? project.name : `Run #${runId}`}
                        </span>
                        <span className="text-gray-300">/</span>
                    </>
                )}
                {suiteRunId !== 'standalone' && (
                    <>
                        <span className="text-sm font-black text-gray-400 uppercase tracking-widest truncate max-w-[200px]">
                            {suiteRun ? suiteRun.name : `Suite Run #${suiteRunId}`}
                        </span>
                        <span className="text-gray-300">/</span>
                    </>
                )}
                <h2 className="text-lg font-black text-gray-900 tracking-tight truncate flex-1">
                    {caseRun.name || 'Test Case Run'}
                </h2>
                {caseRun.status && (() => {
                    const s = caseRun.status.toUpperCase();
                    const isSuccess = s === 'PASSED' || s === 'SUCCESS' || s === 'EXECUTED';
                    const isFailure = s === 'FAILED' || s === 'FAILURE';
                    const isAborted = s === 'ABORTED';
                    const isError = s === 'ERROR';
                    const isRunningStatus = s === 'RUNNING';
                    const isQueued = s === 'QUEUED' || s === 'PENDING';

                    const colors = isSuccess ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        isFailure ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            isAborted ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                isError ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    isRunningStatus ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                        'bg-gray-50 text-gray-500 border-gray-100';

                    return (
                        <div className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm ${colors}`}>
                            {isSuccess && <CheckCircle2 className="w-4 h-4" />}
                            {isFailure && <XCircle className="w-4 h-4" />}
                            {isAborted && <StopCircle className="w-4 h-4" />}
                            {isError && <AlertCircle className="w-4 h-4" />}
                            {isRunningStatus && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isQueued && <Clock className="w-3.5 h-3.5" />}
                            <span className="text-[10px] font-black uppercase tracking-wider">
                                {caseRun.status}
                            </span>
                        </div>
                    );
                })()}
            </div>
            <div className="h-14 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-gray-500 truncate max-w-xl">
                        {caseRun.base_url || 'No URL specified'}
                    </span>
                </div>
                {caseRun.base_url && (
                    <a
                        href={caseRun.base_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                    >
                        Visit Site
                    </a>
                )}
            </div>



            <ScreenshotViewer
                screenshot={selectedStep ? (selectedStep.screenshot_after || selectedStep.screenshot_before) : null}
                number={caseRun.teststep_runs.indexOf(selectedStep!) + 1}
                description={selectedStep ? formatAction(selectedStep.llm_action) : undefined}
                zoomLevel={zoomLevel}
                onZoomIn={() => setZoomLevel(prev => Math.min(prev + 25, 200))}
                onZoomOut={() => setZoomLevel(prev => Math.max(prev - 25, 50))}
                onResetZoom={() => setZoomLevel(100)}
            />
        </div>
    );

    return (
        <TestCaseDetailsLayout
            sidebar={renderSidebar()}
            content={renderContent()}
        />
    );
};
