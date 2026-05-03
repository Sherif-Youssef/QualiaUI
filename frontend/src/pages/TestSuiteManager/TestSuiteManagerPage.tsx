import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TestSuiteManager, SuiteWithCases } from '@/components/TestSuiteManager';
import { ScreenshotViewer } from '@/components/ScreenshotViewer';
import { AddTestCaseModal } from '@/components/Modal/AddTestCaseModal';
import { TestCase, ActionStep } from '@/types/test-case';
import { TestSuiteManagerLayout } from './TestSuiteManagerLayout';
import { testCaseService } from '@/services/testCase/testCaseService';
import { ErrorMessage } from '@/components/GeneralComponents';
import { runService } from '@/services/runService';
import { Scope } from '@/types/run';
import { mapActiveStepToActionStep } from '@/utils/mappers';
import { TestSuiteManagerLoading } from './TestSuiteManagerLoading';

export const TestSuiteManagerPage: React.FC = () => {
    const { projectId, suiteId, caseId } = useParams<{ projectId: string; suiteId?: string; caseId?: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [currentScreenshot, setCurrentScreenshot] = useState('');
    const [currentUrl, setCurrentUrl] = useState('');
    const [zoomLevel, setZoomLevel] = useState(100);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
    const [selectedStep, setSelectedStep] = useState<ActionStep | null>(null);

    const eventSourceRef = useRef<EventSource | null>(null);

    // Group test cases by suite for project-level runs
    const suites = useMemo((): SuiteWithCases[] | undefined => {
        if (suiteId || caseId) return undefined; // Single suite or case view

        const grouped: Record<string, TestCase[]> = {};
        testCases.forEach(tc => {
            const sId = tc.suiteId || 'standalone';
            if (!grouped[sId]) grouped[sId] = [];
            grouped[sId].push(tc);
        });

        return Object.entries(grouped).map(([sId, cases]) => ({
            id: sId,
            name: cases[0]?.suiteName || `Suite ${sId}`,
            testCases: cases
        }));
    }, [testCases, suiteId, caseId]);

    useEffect(() => {
        const fetchContextData = async () => {
            if (!projectId) return;
            setIsLoading(true);
            setError(null);
            try {
                if (suiteId) {
                    const data = await testCaseService.getTestCases(projectId, suiteId, 0, 100);
                    setTestCases(data.testCases);
                } else if (caseId) {
                    const data = await testCaseService.getTestCaseById(projectId, suiteId || '0', caseId);
                    setTestCases([data]);
                } else {
                    // Project-level run
                    const data = await testCaseService.getAllProjectTestCases(projectId);
                    setTestCases(data);
                }

                if (location.state?.runId) {
                    const scope: Scope = location.state.scope || 'TESTSUITE';
                    subscribeToRun(location.state.runId, scope);
                }
            } catch (err: any) {
                const detail = err.response?.data?.detail || err.message;
                const message = Array.isArray(detail)
                    ? detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ')
                    : typeof detail === 'object' ? JSON.stringify(detail) : detail;
                setError(message || 'Failed to load test cases.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchContextData();
        return () => { if (eventSourceRef.current) eventSourceRef.current.close(); };
    }, [projectId, suiteId, caseId, location.state?.runId, location.state?.scope]);

    const handleSaveTestCase = async (data: any) => {
        if (!projectId || !suiteId) return;
        setModalLoading(true);
        setModalError(null);
        try {
            if (editingTestCase) {
                const updated = await testCaseService.updateTestCase(projectId, suiteId, editingTestCase.id, data);
                setTestCases(prev => prev.map(tc => tc.id === editingTestCase.id ? { ...tc, ...updated } : tc));
            } else {
                const newCase = await testCaseService.createTestCase(projectId, suiteId, data);
                setTestCases(prev => [...prev, newCase]);
            }
            setIsModalOpen(false);
            setEditingTestCase(null);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || `Failed to ${editingTestCase ? 'update' : 'create'} test case.`);
        } finally {
            setModalLoading(false);
        }
    };

    const subscribeToRun = (runId: number, scope: Scope) => {
        const eventSource = runService.subscribeToRunProgress(scope, runId, (data: any) => {
            console.log(`[SSE] Received event type: ${data.type}`);
            if (data.type === 'STATUS_CHANGE') {
                const event = typeof data.event === 'string' ? JSON.parse(data.event) : data.event;
                console.log(`[SSE] STATUS_CHANGE:`, event);

                if (event.element === 'TESTCASE') {
                    setTestCases(prev => prev.map(tc => {
                        if (tc.id !== String(event.id)) return tc;

                        let status: TestCase['status'] = 'running';
                        if (event.status === 'PASSED') status = 'success';
                        else if (['FAILED', 'ERROR', 'ABORTED'].includes(event.status)) status = 'failure';

                        console.log(`Test Case ${tc.id} status updated to: ${status}`);
                        return { 
                            ...tc, 
                            status,
                            steps: status === 'running' ? [] : tc.steps
                        };
                    }));
                } else if (event.element === scope && ['PASSED', 'FAILED', 'ABORTED', 'ERROR'].includes(event.status)) {
                    eventSource.close();
                }
                return;
            }

            if (data.type === 'TEST_STEP') {
                const stepData = typeof data.event === 'string' ? JSON.parse(data.event) : data.event;
                console.log(`[SSE] TEST_STEP:`, stepData);
                const testcaseId = stepData.testcase_id;

                setTestCases(prev => {
                    const testCaseExists = prev.some(tc => tc.id === String(testcaseId));
                    console.log(`[SSE] TEST_STEP testCaseExists? ${testCaseExists} for id ${testcaseId}`);

                    return prev.map(tc => {
                        if (tc.id !== String(testcaseId)) return tc;

                        const steps = tc.steps || [];
                        const newStep = mapActiveStepToActionStep(stepData, steps.length);
                        console.log(`[SSE] TEST_STEP mapped ActionStep:`, newStep);

                        if (newStep.screenshot) setCurrentScreenshot(newStep.screenshot);
                        setCurrentUrl(tc.url || '');

                        return {
                            ...tc,
                            steps: [...steps, newStep] as ActionStep[],
                        };
                    });
                });
            }
        });

        eventSourceRef.current = eventSource;
    };


    const handleRunAllTests = async () => {
        if (!projectId) return;
        try {
            if (suiteId) {
                const run = await runService.startTestSuiteRun(parseInt(suiteId), 'NATURAL');
                subscribeToRun(run.run_id, 'TESTSUITE');
            } else if (projectId) {
                const run = await runService.startProjectRun(parseInt(projectId), 'NATURAL');
                subscribeToRun(run.run_id, 'PROJECT');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to start the run.');
        }
    };

    if (isLoading) return <TestSuiteManagerLoading />;

    return (
        <TestSuiteManagerLayout
            error={error && <ErrorMessage message={error} />}
            sidebar={
                <TestSuiteManager
                    testCases={testCases}
                    suites={suites}
                    header={
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => {
                                    if (caseId) {
                                        navigate(`/project/${projectId}/suite/${suiteId}/case/${caseId}`);
                                    } else if (suiteId) {
                                        navigate(`/project/${projectId}/suite/${suiteId}`);
                                    } else {
                                        navigate(`/project/${projectId}`);
                                    }
                                }}
                                className="flex w-fit items-center gap-2 text-gray-400 hover:text-primary transition-all group/back"
                            >
                                <div className="w-6 h-6 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover/back:border-primary group-hover/back:text-primary transition-colors">
                                    <ArrowLeft className="w-3 h-3" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">
                                    {caseId ? 'Back to Test Case' : suiteId ? 'Back to Suite' : 'Back to Project'}
                                </span>
                            </button>
                            <h2 className="text-xl font-sans font-bold text-foreground">
                                {suiteId ? 'Suite Manager' : caseId ? 'Test Run Manager' : 'Project Manager'}
                            </h2>
                        </div>
                    }
                    onAddTestCase={() => {
                        setModalError(null);
                        setIsModalOpen(true);
                    }}
                    onRunAllTests={handleRunAllTests}
                    onRunSingleTest={() => { }}
                    onEditTestCase={(tc) => {
                        setEditingTestCase(tc);
                        setIsModalOpen(true);
                    }}
                    onInstructionChange={async (testId, newInstruction) => {
                        if (!projectId) return;
                        try {
                            const tc = testCases.find(t => t.id === testId);
                            const sId = suiteId || tc?.suiteId;
                            if (!sId) return;
                            await testCaseService.updateTestCase(projectId, sId, testId, { prompt: newInstruction });
                            setTestCases(prev => prev.map(tc => (tc.id === testId ? { ...tc, prompt: newInstruction } : tc)));
                        } catch (err) { }
                    }}
                    onStepTextChange={async (testId, stepId, newText) => {
                        if (!projectId) return;
                        try {
                            const testCase = testCases.find(tc => tc.id === testId);
                            if (!testCase) return;
                            const sId = suiteId || testCase.suiteId;
                            if (!sId) return;
                            const updatedSteps = (testCase.steps || []).map(s => s.id === stepId ? { ...s, text: newText } : s);
                            await testCaseService.updateTestCase(projectId, sId, testId, { steps: updatedSteps });
                            setTestCases(prev => prev.map(tc => tc.id === testId ? { ...tc, steps: updatedSteps as ActionStep[] } : tc));
                        } catch (err) { }
                    }}
                    onStepClick={(step, tc) => {
                        setCurrentScreenshot(step.screenshot || '');
                        setCurrentUrl(tc.url || '');
                        setSelectedStep(step as ActionStep);
                    }}
                />
            }
            content={
                <ScreenshotViewer
                    screenshot={currentScreenshot}
                    url={currentUrl}
                    selectedStep={selectedStep}
                    zoomLevel={zoomLevel}
                    onZoomIn={() => setZoomLevel(z => Math.min(z + 25, 200))}
                    onZoomOut={() => setZoomLevel(z => Math.max(z - 25, 50))}
                    onResetZoom={() => setZoomLevel(100)}
                />
            }
            modals={
                <AddTestCaseModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setModalError(null);
                        setEditingTestCase(null);
                    }}
                    editingTestCase={editingTestCase}
                    onSave={handleSaveTestCase}
                    isLoading={modalLoading}
                    error={modalError}
                />
            }
        />
    );
};
