import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { testCaseService } from '@/services/testCase/testCaseService';
import { ErrorMessage } from '@/components/GeneralComponents';
import { TestCase } from '@/types/test-case';
import { runService, TestCaseRun } from '@/services/runService';
import { ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { TestRunHistoryTable } from './components/TestRunHistoryTable';
import { TestCaseDetailsLayout } from './TestCaseDetailsLayout';
import { StepsSidebar } from './StepsSidebar';
import { ScreenshotViewer } from './ScreenshotViewer';

export const TestCaseDetailsPage: React.FC = () => {
    const { projectId, suiteId, caseId } = useParams<{ projectId: string; suiteId: string; caseId: string }>();
    const navigate = useNavigate();

    const [testCase, setTestCase] = useState<TestCase | null>(null);
    const [history, setHistory] = useState<TestCaseRun[]>([]);
    const [activeView, setActiveView] = useState<'steps' | 'history'>('steps');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStepId, setSelectedStepId] = useState<string>('');
    const [zoomLevel, setZoomLevel] = useState(100);

    useEffect(() => {
        const fetchTestCase = async () => {
            if (!caseId || !projectId || !suiteId) return;
            setIsLoading(true);
            setError(null);
            try {
                const data = await testCaseService.getTestCaseById(projectId, suiteId, caseId);
                setTestCase(data);
                if (data.executionSteps && data.executionSteps.length > 0) {
                    const firstStep = data.executionSteps[0];
                    if (firstStep && firstStep.id) {
                        setSelectedStepId(String(firstStep.id));
                    }
                }
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load test case details.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTestCase();
    }, [caseId, projectId, suiteId]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!caseId || !projectId || !suiteId || activeView !== 'history') return;
            try {
                const result = await runService.getTestCaseRuns(projectId, suiteId, caseId, 0, 50);
                setHistory(result.runs);
            } catch (err: any) {
                console.error('Failed to load test case history:', err);
            }
        };
        fetchHistory();
    }, [caseId, projectId, suiteId, activeView]);

    const selectedStep = testCase?.executionSteps?.find(s => String(s.id) === selectedStepId);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Loading Details...</p>
            </div>
        );
    }

    if (error) return <div className="p-8"><ErrorMessage message={error} /></div>;
    if (!testCase) return <div className="p-8 text-center text-gray-500 font-bold">Test Case not found</div>;

    const renderSidebar = () => (
        <StepsSidebar
            testCase={testCase}
            steps={testCase.executionSteps || []}
            selectedStepId={selectedStepId}
            onSelectStep={setSelectedStepId}
            isRunning={false}
            finalStatus={null}
        />
    );

    const renderContent = () => {
        if (activeView === 'history') {
            return (
                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-5xl mx-auto space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight capitalize">Run History</h2>
                            <Button
                                onClick={() => setActiveView('steps')}
                                variant="outline"
                                className="rounded-xl border-gray-200"
                            >
                                <ListChecks className="w-4 h-4 mr-2" />
                                Back to Steps
                            </Button>
                        </div>
                        <TestRunHistoryTable
                            history={history}
                            projectId={projectId || ''}
                            onRunClick={(run) => {
                                const sId = run.testsuite_run_id || 'standalone';
                                const rId = (run as any).project_run_id || 'standalone';
                                navigate(`/project/${projectId}/history/${rId}/suite/${sId}/case/${run.id}`);
                            }}
                        />
                    </div>
                </div>
            );
        }

        return (
            <div className="flex-1 flex overflow-hidden">
                <ScreenshotViewer
                    screenshot={selectedStep?.screenshot || null}
                    number={selectedStep?.number || 0}
                    zoomLevel={zoomLevel}
                    setZoomLevel={setZoomLevel}
                />
            </div>
        );
    };

    return (
        <TestCaseDetailsLayout
            sidebar={activeView === 'steps' ? renderSidebar() : null}
            content={renderContent()}
        />
    );
};
