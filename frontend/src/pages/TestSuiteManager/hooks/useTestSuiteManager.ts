import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TestCase, ActionStep } from '@/types/test-case';
import { testCaseService } from '@/services/testCase/testCaseService';
import { runService } from '@/services/runService';
import { Scope, TestCaseRun } from '@/types/run';
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
                const element = (event.element || '').toUpperCase();
                const status = (event.status || '').toUpperCase();
                const eventId = event.id;

                if (element === 'TESTCASE' || element === 'TESTCASE_RUN') {
                    const eventTestCaseId = String(event.testcase_id || (event.element_data?.testcase_id) || '');

                    setTestCases(prev => prev.map(tc => {
                        const isMatch = (eventTestCaseId && String(tc.id) === eventTestCaseId) ||
                            (eventId && String((tc as any).runId) === String(eventId));

                        if (!isMatch) return tc;

                        let tcStatus: TestCase['status'] = 'running';
                        if (['PASSED', 'SUCCESS', 'EXECUTED'].includes(status)) tcStatus = 'success';
                        else if (['FAILED', 'ERROR', 'ABORTED', 'FAILURE'].includes(status)) tcStatus = 'failure';

                        return {
                            ...tc,
                            status: tcStatus,
                            runId: eventId || (tc as any).runId,
                            steps: tcStatus === 'running' && tc.status !== 'running' ? [] : tc.steps
                        };
                    }));
                }
                else if ((element === scope || element === `${scope}_RUN`) &&
                    ['PASSED', 'FAILED', 'ABORTED', 'ERROR', 'SUCCESS', 'FAILURE'].includes(status)) {
                    eventSource.close();
                    setIsRunning(false);
                    setIsAborting(false);
                    setActiveRunId(null);
                }
            }

            if (data.type === 'TEST_STEP') {
                const stepData = typeof data.event === 'string' ? JSON.parse(data.event) : data.event;
                const testcaseId = String(stepData.testcase_id || '');
                const testcaseRunId = String(stepData.testcase_run_id || stepData.run_id || '');

                setTestCases(prev => {
                    return prev.map(tc => {
                        const isMatch = (testcaseId && String(tc.id) === testcaseId) ||
                            (testcaseRunId && String((tc as any).runId) === testcaseRunId);

                        if (!isMatch) return tc;

                        const steps = tc.steps || [];
                        const stepExistsIndex = steps.findIndex(s => String(s.id) === String(stepData.id));

                        let newSteps = [...steps];
                        const mappedStep = mapActiveStepToActionStep(stepData, stepExistsIndex >= 0 ? stepExistsIndex : steps.length);

                        if (stepExistsIndex >= 0) {
                            newSteps[stepExistsIndex] = mappedStep;
                        } else {
                            newSteps.push(mappedStep);
                        }

                        // Auto-follow logic for the large screenshot viewer
                        const isCurrentlyViewed = caseId ? String(tc.id) === String(caseId) : true;

                        if (isCurrentlyViewed && (mappedStep.screenshot || mappedStep.text)) {
                            if (mappedStep.screenshot) setCurrentScreenshot(mappedStep.screenshot);
                            setCurrentUrl(tc.url || '');
                            setSelectedStep(mappedStep);
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
    }, [caseId]);

    useEffect(() => {
        const fetchContextData = async () => {
            if (!projectId) return;
            setIsLoading(true);
            setError(null);
            try {
                let initialTestCases: TestCase[] = [];
                if (caseId) {
                    const data = await testCaseService.getTestCaseById(projectId, suiteId || '0', caseId);
                    initialTestCases = [data];
                } else if (suiteId) {
                    const data = await testCaseService.getTestCases(projectId, suiteId, 0, 100);
                    initialTestCases = data.testCases;
                } else {
                    initialTestCases = await testCaseService.getAllProjectTestCases(projectId);
                }
                setTestCases(initialTestCases);

                if (location.state?.runId) {
                    const rId = location.state.runId;
                    const scope: Scope = location.state.scope || 'TESTSUITE';

                    setIsRunning(true);
                    subscribeToRun(rId, scope);

                    try {
                        let runDetails: any;
                        if (scope === 'TESTSUITE') {
                            runDetails = await runService.getTestSuiteRunDetails(rId);
                        } else if (scope === 'PROJECT') {
                            runDetails = await runService.getProjectRunDetails(rId);
                            const testcaseRuns: TestCaseRun[] = [];
                            (runDetails as any).testsuite_runs?.forEach((sr: any) => {
                                testcaseRuns.push(...(sr.testcase_runs || []));
                            });
                            (runDetails as any).testcase_runs = testcaseRuns;
                        } else if (scope === 'TESTCASE') {
                            const tcr = await runService.getTestCaseRunDetails(rId);
                            runDetails = { testcase_runs: [tcr], status: tcr.status };
                        }

                        if (runDetails && runDetails.testcase_runs) {
                            let activeCaseRunDetails: any = null;
                            if (caseId) {
                                const caseRun = runDetails.testcase_runs.find((r: any) => String(r.testcase_id) === caseId);
                                if (caseRun) {
                                    try {
                                        activeCaseRunDetails = await runService.getTestCaseRunDetails(caseRun.id);
                                    } catch (err) {
                                        console.warn("Failed to fetch detailed case run:", err);
                                    }
                                }
                            }

                            setTestCases(prev => prev.map(tc => {
                                const run = (activeCaseRunDetails && String(activeCaseRunDetails.testcase_id) === tc.id)
                                    ? activeCaseRunDetails
                                    : runDetails.testcase_runs.find((r: any) => String(r.testcase_id) === tc.id);

                                if (!run) return tc;

                                let status: TestCase['status'] = 'running';
                                if (run.status === 'PASSED' || run.status === 'EXECUTED' || run.status === 'SUCCESS') status = 'success';
                                else if (['FAILED', 'ERROR', 'ABORTED', 'FAILURE'].includes(run.status)) status = 'failure';
                                else if (['QUEUED', 'PENDING'].includes(run.status)) status = 'idle';

                                const apiSteps = run.teststep_runs?.map((stepRun: any, idx: number) =>
                                    mapActiveStepToActionStep(stepRun, idx)
                                ) || [];
                                const currentSteps = tc.steps || [];

                                return {
                                    ...tc,
                                    status,
                                    runId: run.id,
                                    steps: apiSteps.length >= currentSteps.length ? apiSteps : currentSteps
                                };
                            }));

                            if (['PASSED', 'FAILED', 'ABORTED', 'ERROR', 'SUCCESS', 'FAILURE'].includes(runDetails.status)) {
                                setIsRunning(false);
                            }

                            if (caseId) {
                                const runForActive = (activeCaseRunDetails && String(activeCaseRunDetails.testcase_id) === caseId)
                                    ? activeCaseRunDetails
                                    : runDetails.testcase_runs.find((r: any) => String(r.testcase_id) === caseId);

                                if (runForActive && runForActive.teststep_runs && runForActive.teststep_runs.length > 0) {
                                    const lastStepData = runForActive.teststep_runs[runForActive.teststep_runs.length - 1];
                                    const lastStep = mapActiveStepToActionStep(lastStepData, runForActive.teststep_runs.length - 1);
                                    if (lastStep.screenshot) setCurrentScreenshot(lastStep.screenshot);
                                    const activeTC = initialTestCases.find(tc => tc.id === caseId);
                                    setCurrentUrl(activeTC?.url || '');
                                    setSelectedStep(lastStep);
                                }
                            }
                        }
                    } catch (runErr) {
                        console.error("Failed to fetch initial run data:", runErr);
                    }
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

    const [isAborting, setIsAborting] = useState(false);
    const [runScope, setRunScope] = useState<Scope | null>(location.state?.scope || null);

    const handleRunAllTests = useCallback(async (model: string = 'gemini-1.5-pro') => {
        if (!projectId) return;
        setIsRunning(true);
        try {
            if (suiteId) {
                const run = await runService.startTestSuiteRun(parseInt(suiteId), 'NATURAL', model);
                const details = await runService.getTestSuiteRunDetails(run.run_id);

                setActiveRunId(run.run_id);
                setRunScope('TESTSUITE');
                setTestCases(prev => prev.map(tc => {
                    const caseRun = details.testcase_runs?.find((r: any) => String(r.testcase_id) === String(tc.id));
                    return {
                        ...tc,
                        status: 'running',
                        runId: caseRun?.id || null,
                        steps: []
                    };
                }));
                subscribeToRun(run.run_id, 'TESTSUITE');
            } else if (projectId) {
                const run = await runService.startProjectRun(parseInt(projectId), 'NATURAL', model);
                const details = await runService.getProjectRunDetails(run.run_id);

                setActiveRunId(run.run_id);
                setRunScope('PROJECT');
                setTestCases(prev => prev.map(tc => {
                    let caseRun: any = null;
                    (details as any).testsuite_runs?.forEach((sr: any) => {
                        const found = sr.testcase_runs?.find((r: any) => String(r.testcase_id) === String(tc.id));
                        if (found) caseRun = found;
                    });

                    return {
                        ...tc,
                        status: 'running',
                        runId: caseRun?.id || null,
                        steps: []
                    };
                }));
                subscribeToRun(run.run_id, 'PROJECT');
            }
        } catch (err: any) {
            setIsRunning(false);
            setError(err.response?.data?.detail || 'Failed to start the run.');
        }
    }, [projectId, suiteId, subscribeToRun]);

    const handleRunSingleTest = useCallback(async (testId: string, model: string = 'gemini-1.5-pro') => {
        setIsRunning(true);
        try {
            const run = await runService.startTestCaseRun(parseInt(testId), 'NATURAL', model);
            setActiveRunId(run.run_id);
            setRunScope('TESTCASE');

            setTestCases(prev => prev.map(tc => {
                if (tc.id === testId) {
                    return { ...tc, status: 'running', runId: run.run_id, steps: [] };
                }
                return tc;
            }));

            subscribeToRun(run.run_id, 'TESTCASE');
        } catch (err: any) {
            setIsRunning(false);
            setError(err.response?.data?.detail || 'Failed to start test case run.');
        }
    }, [subscribeToRun]);

    const handleAbortRun = useCallback(async () => {
        if (!activeRunId || !runScope) return;
        setIsAborting(true);
        try {
            if (runScope === 'TESTCASE') {
                await runService.abortTestCaseRun(activeRunId);
            } else if (runScope === 'TESTSUITE') {
                await runService.abortTestSuiteRun(activeRunId);
            } else if (runScope === 'PROJECT') {
                await runService.abortProjectRun(activeRunId);
            }
        } catch (err: any) {
            console.error("Failed to abort run:", err);
            setIsAborting(false);
        }
    }, [activeRunId, runScope]);

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
        navigate(-1);
    }, [navigate]);

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
        handleRunSingleTest,
        handleAbortRun,
        handleInstructionChange,
        handleStepTextChange,
        handleStepClick,
        handleBack
    };
};
