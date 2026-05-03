import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { runService } from '@/services/runService';
import { TestCaseRun, TestStepRun } from '@/types/run';
import { ErrorMessage } from '@/components/GeneralComponents';
import { TestSuiteManagerLoading } from '../TestSuiteManager/TestSuiteManagerLoading';
import { Globe } from 'lucide-react';
import { TestCaseDetailsLayout } from '../TestCaseDetails/TestCaseDetailsLayout';
import { ScreenshotViewer } from '../TestCaseDetails/ScreenshotViewer';
import { TestRunStepsSidebar } from './components/TestRunStepsSidebar';
import { formatAction } from '@/utils/formatters';

export const ProjectCaseHistoryDetailsPage: React.FC = () => {
    const { runId, suiteRunId, caseRunId } = useParams<{
        runId: string;
        suiteRunId: string;
        caseRunId: string;
    }>();
    const [caseRun, setCaseRun] = useState<(TestCaseRun & { teststep_runs: TestStepRun[] }) | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStepId, setSelectedStepId] = useState<number | null>(null);

    useEffect(() => {
        const fetchCaseDetails = async () => {
            if (!caseRunId) return;
            setIsLoading(true);
            setError(null);
            try {
                const id = parseInt(caseRunId);
                const data = await runService.getTestCaseRunDetails(id);
                setCaseRun(data);
                if (data.teststep_runs?.length > 0) {
                    setSelectedStepId(data.teststep_runs[0].id);
                }
            } catch (err: any) {
                console.error('Case history details error:', err);
                setError(err.response?.data?.detail || 'Failed to load case run details.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCaseDetails();
    }, [caseRunId]);

    const selectedStep = caseRun?.teststep_runs?.find(s => s.id === selectedStepId);

    if (isLoading) return <TestSuiteManagerLoading />;
    if (error) return <div className="p-8"><ErrorMessage message={error} /></div>;
    if (!caseRun) return <div className="p-8 text-center text-gray-500 font-bold">Case run not found</div>;

    const renderSidebar = () => (
        <TestRunStepsSidebar
            caseName={caseRun.name || 'Test Case'}
            instruction={caseRun.instruction}
            steps={caseRun.teststep_runs || []}
            selectedStepId={selectedStepId}
            onSelectStep={setSelectedStepId}
        />
    );

    const renderContent = () => (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-16 bg-white border-b border-gray-100 flex items-center px-8 gap-4 shrink-0">
                {runId !== 'standalone' && (
                    <>
                        <span className="text-sm font-black text-gray-400 uppercase tracking-widest">
                            Run <span className="text-primary/60">#{runId}</span>
                        </span>
                        <span className="text-gray-300">/</span>
                    </>
                )}
                {suiteRunId !== 'standalone' && (
                    <>
                        <span className="text-sm font-black text-gray-400 uppercase tracking-widest truncate max-w-[200px]">
                            Suite Run <span className="text-primary/60">#{suiteRunId}</span>
                        </span>
                        <span className="text-gray-300">/</span>
                    </>
                )}
                <h2 className="text-lg font-black text-gray-900 tracking-tight truncate flex-1">
                    {caseRun.name || 'Test Case Run'}
                </h2>
            </div>

            {/* Top Bar with URL */}
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

            {(caseRun.status === 'FAILED' || caseRun.status === 'ERROR') && caseRun.termination_reason && (
                <div className="bg-failure/5 border-b border-failure/20 p-4 shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-failure animate-pulse" />
                        <h3 className="text-xs font-black text-failure uppercase tracking-widest">Test Case Failure Reason</h3>
                    </div>
                    <p className="text-sm text-failure/90 font-medium leading-relaxed max-w-4xl pl-4 border-l-2 border-failure/20">
                        {caseRun.termination_reason}
                    </p>
                </div>
            )}

            <ScreenshotViewer
                screenshot={selectedStep ? (selectedStep.screenshot_after || selectedStep.screenshot_before) : null}
                number={caseRun.teststep_runs.indexOf(selectedStep!) + 1}
                description={selectedStep ? formatAction(selectedStep.llm_action) : undefined}
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
