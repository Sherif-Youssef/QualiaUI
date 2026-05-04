import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TestCase, ActionStep } from '@/types/test-case';
import { testCaseService } from '@/services/testCase/testCaseService';
import { runService } from '@/services/runService';
import { Scope } from '@/types/run';
import { SuiteWithCases } from '@/components/TestSuiteManager';
import { mapActiveStepToActionStep } from '@/utils/mappers';

interface UseTestSuiteManagerProps {
    projectId?: string;
    suiteId?: string;
    caseId?: string;
}

export const useTestSuiteManager = ({ projectId, suiteId, caseId }: UseTestSuiteManagerProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [currentScreenshot, setCurrentScreenshot] = useState('');
    const [currentUrl, setCurrentUrl] = useState('');
    const [zoomLevel, setZoomLevel] = useState(100);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRunning, setIsRunning] = useState<boolean>(!!location.state?.runId);
    const [activeRunId, setActiveRunId] = useState<number | null>(location.state?.runId || null);
    const [error, setError] = useState<string | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
    const [selectedStep, setSelectedStep] = useState<ActionStep | null>(null);

    const eventSourceRef = useRef<EventSource | null>(null);
    const suites = useMemo((): SuiteWithCases[] | undefined => {
        if (suiteId || caseId) return undefined;
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

    const subscribeToRun = useCallback((runId: number, scope: Scope) => {
        if (eventSourceRef.current) {
            console.log(`[SSE] Closing previous connection before subscribing to new run ${runId}`);
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

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
                    setIsRunning(false);
                    setIsAborting(false);
                    setActiveRunId(null);
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
                        const stepExistsIndex = steps.findIndex(s => s.id === stepData.id);

                        let newSteps = [...steps];
                        if (stepExistsIndex >= 0) {
                            // Update existing step (e.g. status change)
                            newSteps[stepExistsIndex] = mapActiveStepToActionStep(stepData, stepExistsIndex);
                        } else {
                            // Append new step
                            const newStep = mapActiveStepToActionStep(stepData, steps.length);
                            newSteps.push(newStep);
                            if (newStep.screenshot) setCurrentScreenshot(newStep.screenshot);
                            setCurrentUrl(tc.url || '');
                        }

                        return {
                            ...tc,
                            steps: newSteps,
                        };
                    });
                });
            }
        });

        eventSourceRef.current = eventSource;
    }, []);

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
    }, [projectId, suiteId, caseId, location.state?.runId, location.state?.scope, subscribeToRun]);

    const handleSaveTestCase = useCallback(async (data: any) => {
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
    }, [projectId, suiteId, editingTestCase]);

    const handleRunAllTests = useCallback(async (model: string = 'gemini-1.5-pro') => {
        if (!projectId) return;
        setIsRunning(true);
        try {
            if (suiteId) {
                const run = await runService.startTestSuiteRun(parseInt(suiteId), 'NATURAL', model);
                setActiveRunId(run.run_id);
                subscribeToRun(run.run_id, 'TESTSUITE');
            } else if (projectId) {
                const run = await runService.startProjectRun(parseInt(projectId), 'NATURAL', model);
                setActiveRunId(run.run_id);
                subscribeToRun(run.run_id, 'PROJECT');
            }
        } catch (err: any) {
            setIsRunning(false);
            setError(err.response?.data?.detail || 'Failed to start the run.');
        }
    }, [projectId, suiteId, subscribeToRun]);

    const [isAborting, setIsAborting] = useState(false);

    const handleAbortRun = useCallback(async () => {
        if (!activeRunId) return;
        setIsAborting(true);
        try {
            if (suiteId) {
                await runService.abortTestSuiteRun(activeRunId);
            } else if (projectId) {
                await runService.abortProjectRun(activeRunId);
            }
        } catch (err: any) {
            console.error("Failed to abort run:", err);
            setIsAborting(false);
        }
    }, [projectId, suiteId, activeRunId]);

    const handleInstructionChange = useCallback(async (testId: string, newInstruction: string) => {
        if (!projectId) return;
        try {
            const tc = testCases.find(t => t.id === testId);
            const sId = suiteId || tc?.suiteId;
            if (!sId) return;
            await testCaseService.updateTestCase(projectId, sId, testId, { prompt: newInstruction });
            setTestCases(prev => prev.map(tc => (tc.id === testId ? { ...tc, prompt: newInstruction } : tc)));
        } catch (err) { }
    }, [projectId, suiteId, testCases]);

    const handleStepTextChange = useCallback(async (testId: string, stepId: string, newText: string) => {
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
    }, [projectId, suiteId, testCases]);

    const handleStepClick = useCallback((step: any, tc: TestCase) => {
        setCurrentScreenshot(step.screenshot || '');
        setCurrentUrl(tc.url || '');
        setSelectedStep(step as ActionStep);
    }, []);

    const handleBack = useCallback(() => {
        if (caseId) {
            navigate(`/project/${projectId}/suite/${suiteId}/case/${caseId}`);
        } else if (suiteId) {
            navigate(`/project/${projectId}/suite/${suiteId}`);
        } else {
            navigate(`/project/${projectId}`);
        }
    }, [projectId, suiteId, caseId, navigate]);

    return {
        testCases,
        suites,
        currentScreenshot,
        currentUrl,
        zoomLevel, setZoomLevel,
        isModalOpen, setIsModalOpen,
        isLoading,
        error,
        modalLoading,
        modalError, setModalError,
        editingTestCase, setEditingTestCase,
        selectedStep,
        isRunning,
        isAborting,
        handleSaveTestCase,
        handleRunAllTests,
        handleAbortRun,
        handleInstructionChange,
        handleStepTextChange,
        handleStepClick,
        handleBack
    };
};
