import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { testCaseService } from '@/services/testCase/testCaseService';
import { ErrorMessage } from '@/components/GeneralComponents';
import { TestCase } from '@/types/test-case';
import { runService } from '@/services/runService';
import { TestCaseRun } from '@/types/run';
import { Play, Camera, Clock, LayoutGrid, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { TestRunHistoryTable } from './components/TestRunHistoryTable';
import { TestCaseDetailsLayout } from './TestCaseDetailsLayout';
import { ScreenshotViewer } from './ScreenshotViewer';
import { formatAction } from '@/utils/formatters';

export const TestCaseDetailsPage: React.FC = () => {
    const { projectId, suiteId, caseId } = useParams<{ projectId: string; suiteId: string; caseId: string }>();
    const navigate = useNavigate();

    const [testCase, setTestCase] = useState<TestCase | null>(null);
    const [history, setHistory] = useState<TestCaseRun[]>([]);
    const [activeView, setActiveView] = useState<'steps' | 'history'>('steps');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStepId, setSelectedStepId] = useState<string>('');
    const [isRunning, setIsRunning] = useState(false);
    const [activeSteps, setActiveSteps] = useState<any[]>([]);
    const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);
    const [, setFinalStatus] = useState<'passed' | 'failed' | null>(null);

    const eventSourceRef = React.useRef<EventSource | null>(null);

    const fetchTestCase = async () => {
        if (!caseId || !projectId || !suiteId) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await testCaseService.getTestCaseById(projectId, suiteId, caseId);
            setTestCase(data);
            if (data.executionSteps && data.executionSteps.length > 0) {
                setSelectedStepId(String(data.executionSteps[0].id));
            } else if (data.steps && data.steps.length > 0) {
                setSelectedStepId(String(data.steps[0].id));
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load test case details.');
        } finally {
            setIsLoading(false);
        }
    };

    const refreshTestCaseSilent = async () => {
        if (!caseId || !projectId || !suiteId) return;
        try {
            const data = await testCaseService.getTestCaseById(projectId, suiteId, caseId);
            setTestCase(data);
        } catch { }
    };

    useEffect(() => {
        fetchTestCase();
        return () => {
            if (eventSourceRef.current) eventSourceRef.current.close();
        };
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

    const handleRunTest = async () => {
        if (!projectId || !suiteId || !caseId) return;
        setIsRunning(true);
        setFinalStatus(null);
        setActiveSteps([]);
        setCurrentScreenshot(null);

        try {
            const run = await runService.startTestCaseRun(parseInt(caseId), 'NATURAL');
            const eventSource = runService.subscribeToRunProgress('TESTCASE', run.run_id, (data: any) => {
                const msgType: string = data.type || '';
                const eventPayload = typeof data.event === 'string' ? JSON.parse(data.event) : data.event;

                if (msgType === 'STATUS_CHANGE' && eventPayload) {
                    if (eventPayload.element === 'TESTCASE' && eventPayload.id === parseInt(caseId)) {
                        if (eventPayload.status === 'PASSED') setFinalStatus('passed');
                        else if (['FAILED', 'ERROR', 'ABORTED'].includes(eventPayload.status)) setFinalStatus('failed');

                        if (['PASSED', 'FAILED', 'ERROR', 'ABORTED'].includes(eventPayload.status)) {
                            setIsRunning(false);
                            eventSource.close();
                            refreshTestCaseSilent();
                        }
                    }
                }

                if (msgType === 'TEST_STEP' && eventPayload) {
                    const stepData = eventPayload;
                    const screenshotUrl = stepData.snapshot_after?.screenshot || stepData.snapshot_before?.screenshot || '';
                    const mappedStep = {
                        id: crypto.randomUUID(),
                        number: 0,
                        text: JSON.stringify(stepData),
                        screenshot: screenshotUrl,
                        status: stepData.status?.toLowerCase() || 'pending'
                    };
                    setActiveSteps(prev => {
                        const stepWithNumber = { ...mappedStep, number: prev.length + 1 };
                        if (prev.length === 0) setSelectedStepId(String(stepWithNumber.id));
                        if (stepWithNumber.screenshot) setCurrentScreenshot(stepWithNumber.screenshot);
                        return [...prev, stepWithNumber];
                    });
                }
            });
            eventSourceRef.current = eventSource;
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to start test run.');
            setIsRunning(false);
        }
    };

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

    const displaySteps = (isRunning || activeSteps.length > 0)
        ? activeSteps
        : (testCase.steps && testCase.steps.length > 0 ? testCase.steps : (testCase.executionSteps || []));

    return (
        <TestCaseDetailsLayout>
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-white border-b border-gray-100 shrink-0">
                    <div className="px-8 pt-4 pb-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigate(`/project/${projectId}/suite/${suiteId}`)}
                                    className="w-9 h-9 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-600 hover:text-primary hover:border-primary transition-all hover:scale-105 active:scale-95"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                <div>
                                    <h1 className="text-xl font-black text-gray-900 tracking-tight">
                                        {testCase.name}
                                    </h1>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleRunTest}
                                    disabled={isRunning}
                                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl h-11 px-6 font-bold flex items-center gap-2 transition-all active:scale-[0.98]"
                                >
                                    <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : 'fill-white'}`} />
                                    {isRunning ? 'Running...' : 'Run Test'}
                                </Button>
                            </div>
                        </div>

                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setActiveView('steps')}
                                className={`flex items-center gap-2 px-6 py-2 text-sm font-bold transition-colors relative ${activeView === 'steps' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                                Test Steps
                                {activeView === 'steps' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                            </button>
                            <button
                                onClick={() => setActiveView('history')}
                                className={`flex items-center gap-2 px-6 py-2 text-sm font-bold transition-colors relative ${activeView === 'history' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Clock className="w-4 h-4" />
                                Run History
                                {activeView === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area (Sidebar + Viewer) */}
                <div className="flex-1 flex overflow-hidden">
                    {activeView === 'steps' ? (
                        <>
                            <aside className="w-[400px] bg-white border-r border-gray-100 flex flex-col shadow-sm">
                                <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Execution Steps</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    {displaySteps.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                            <LayoutGrid className="w-8 h-8 text-gray-300 mb-3" />
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No steps recorded</p>
                                        </div>
                                    ) : (
                                        displaySteps.map((step, index) => (
                                            <div
                                                key={step.id}
                                                onClick={() => setSelectedStepId(String(step.id))}
                                                className={`p-4 rounded-xl border transition-all cursor-pointer group relative overflow-hidden ${selectedStepId === String(step.id)
                                                    ? 'bg-primary/[0.03] border-primary shadow-sm'
                                                    : 'bg-white border-gray-100 hover:border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <span className={`flex-shrink-0 w-8 h-8 rounded-lg text-xs font-black flex items-center justify-center transition-colors ${selectedStepId === String(step.id) ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'
                                                        }`}>
                                                        {index + 1}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex gap-3 mb-2">
                                                            <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${step.screenshot ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-300'
                                                                }`}>
                                                                <Camera className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm text-gray-700 font-medium leading-relaxed truncate">
                                                                    {formatAction(step.text)}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${step.status === 'passed' ? 'bg-emerald-500' :
                                                                        step.status === 'failed' ? 'bg-rose-500' : 'bg-gray-300'
                                                                        }`} />
                                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                                        {step.status || 'Pending'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {selectedStepId === String(step.id) && (
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </aside>
                            <main className="flex-1 flex overflow-hidden bg-gray-50/30">
                                <ScreenshotViewer
                                    screenshot={displaySteps.find(s => String(s.id) === selectedStepId)?.screenshot || currentScreenshot || null}
                                    number={displaySteps.findIndex(s => String(s.id) === selectedStepId) + 1}
                                />
                            </main>
                        </>
                    ) : (
                        <main className="flex-1 overflow-auto p-8 bg-gray-50/30">
                            <div className="max-w-6xl mx-auto">
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
                        </main>
                    )}
                </div>
            </div>
        </TestCaseDetailsLayout>
    );
};
