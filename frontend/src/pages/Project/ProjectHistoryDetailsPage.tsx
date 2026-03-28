import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TestSuiteManager } from '@/components/TestSuiteManager';
import { ScreenshotViewer } from '@/components/ScreenshotViewer';
import { TestSuiteManagerLayout } from '../TestSuiteManager/TestSuiteManagerLayout';
import { runHistoryService } from '@/services/runs/runHistoryService';
import { ErrorMessage } from '@/components/GeneralComponents';
import { TestCase, ActionStep } from '@/types/test-case';
import { TestSuiteManagerLoading } from '../TestSuiteManager/TestSuiteManagerLoading';
import { TestRunRead } from '@/types/run';
import { Clock, Calendar, CheckCircle2, XCircle, AlertCircle, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ProjectHistoryDetailsPage: React.FC = () => {
    const { projectId, runId } = useParams<{ projectId: string; runId: string }>();
    const navigate = useNavigate();
    const [run, setRun] = useState<TestRunRead | null>(null);
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [currentScreenshot, setCurrentScreenshot] = useState('');
    const [currentUrl, setCurrentUrl] = useState('');
    const [zoomLevel, setZoomLevel] = useState(100);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistoryDetails = async () => {
            if (!projectId || !runId) return;
            setIsLoading(true);
            setError(null);
            try {
                const { run: runData, testCases: fullTestCases } = await runHistoryService.getRunFullDetails(projectId, runId);
                setRun(runData);
                setTestCases(fullTestCases);
                
                if (fullTestCases.length > 0 && fullTestCases[0].steps && fullTestCases[0].steps.length > 0) {
                    const firstStep = fullTestCases[0].steps[0] as ActionStep;
                    setCurrentScreenshot(firstStep.screenshot || '');
                    setCurrentUrl(fullTestCases[0].url || '');
                }
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load historical details.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistoryDetails();
    }, [projectId, runId]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PASSED': return <CheckCircle2 className="w-5 h-5 text-success" />;
            case 'FAILED': return <XCircle className="w-5 h-5 text-failure" />;
            default: return <AlertCircle className="w-5 h-5 text-warning" />;
        }
    };

    const getDuration = () => {
        if (!run?.started_at || !run?.finished_at) return null;
        const start = new Date(run.started_at).getTime();
        const end = new Date(run.finished_at).getTime();
        const diff = Math.abs(end - start) / 1000;
        const minutes = Math.floor(diff / 60);
        const seconds = Math.floor(diff % 60);
        return `${minutes}m ${seconds}s`;
    };

    if (isLoading) return <TestSuiteManagerLoading />;

    return (
        <TestSuiteManagerLayout
            error={error && <ErrorMessage message={error} />}
            sidebar={
                <TestSuiteManager
                    testCases={testCases}
                    isReadOnly={true}
                    header={
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => navigate(`/project/${projectId}/history`)}
                                    className="h-8 w-8 rounded-lg hover:bg-gray-100"
                                >
                                    <ChevronLeft className="w-5 h-5 text-gray-500" />
                                </Button>
                                <h2 className="text-xl font-sans font-bold text-foreground">
                                    Run Result
                                </h2>
                                {run && (
                                    <div className="ml-auto">
                                        {getStatusIcon(run.status)}
                                    </div>
                                )}
                            </div>

                            {run && (
                                <div className="grid grid-cols-2 gap-3 pb-2">
                                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">
                                            {new Date(run.started_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">
                                            {getDuration()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    }
                    onAddTestCase={() => {}}
                    onRunAllTests={() => {}}
                    onRunSingleTest={() => {}}
                    onEditTestCase={() => {}}
                    onInstructionChange={() => {}}
                    onStepTextChange={() => {}}
                    onStepClick={(step, tc) => {
                        setCurrentScreenshot(step.screenshot || '');
                        setCurrentUrl(tc.url || '');
                    }}
                />
            }
            content={
                <ScreenshotViewer
                    screenshot={currentScreenshot}
                    url={currentUrl}
                    zoomLevel={zoomLevel}
                    onZoomIn={() => setZoomLevel((z: number) => Math.min(z + 25, 200))}
                    onZoomOut={() => setZoomLevel((z: number) => Math.max(z - 25, 50))}
                    onResetZoom={() => setZoomLevel(100)}
                />
            }
            modals={null}
        />
    );
};
