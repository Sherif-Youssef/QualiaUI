import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TestCase, ActionStep, Scope } from '@/types';
import { testCaseService } from '@/services/testCase/testCaseService';
import { runService } from '@/services/runService';
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
    const [activeCaseId, setActiveCaseId] = useState<string | null>(caseId || null);
    const activeCaseIdRef = useRef<string | null>(caseId || null);
    const [runScope, setRunScope] = useState<Scope | null>(location.state?.scope || null);
    const [isAborting, setIsAborting] = useState(false);
    const isStartingRef = useRef(false);

    useEffect(() => {
        activeCaseIdRef.current = activeCaseId;
    }, [activeCaseId]);

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
        setIsRunning(true);

        const eventSource = runService.subscribeToRunProgress(scope, runId, (data: any) => {
            console.log(`[SSE] Received event type: ${data.type} for run ${runId}`);
            if (data.type === 'STATUS_CHANGE') {
                const event = typeof data.event === 'string' ? JSON.parse(data.event) : data.event;
                const element = (event.element || '').toUpperCase();
                const status = (event.status || '').toUpperCase();
                const eventId = event.id;

                console.log(`[SSE] Status Change: ${element} ${status} (ID: ${eventId})`);

                if (element === 'TESTCASE' || element === 'TESTCASE_RUN') {
                    const eventTestCaseId = String(event.testcase_id || (event.element_data?.testcase_id) || '');

                    setTestCases(prev => prev.map(tc => {
                        const isMatch = (eventTestCaseId && String(tc.id) === eventTestCaseId) ||
                            (element === 'TESTCASE' && eventId && String(tc.id) === String(eventId)) ||
                            (element === 'TESTCASE_RUN' && eventId && String((tc as any).runId) === String(eventId));

                        if (!isMatch) return tc;

                        let tcStatus: TestCase['status'] = 'running';
                        if (['PASSED', 'SUCCESS', 'EXECUTED', 'COMPLETED', 'FINISHED'].includes(status)) {
                            tcStatus = 'passed';
                        } else if (['FAILED', 'FAILURE', 'STOPPED'].includes(status)) {
                            tcStatus = 'failed';
                        } else if (status === 'ABORTED') {
                            tcStatus = 'aborted';
                        } else if (status === 'ERROR') {
                            tcStatus = 'error';
                        } else if (['QUEUED', 'PENDING', 'IDLE'].includes(status)) {
                            tcStatus = 'idle';
                        }

                        return {
                            ...tc,
                            status: tcStatus,
                            terminationReason: event.termination_reason || tc.terminationReason,
                            runId: (element === 'TESTCASE_RUN' ? eventId : (tc as any).runId),
                            steps: tcStatus === 'running' && tc.status !== 'running' ? [] : tc.steps
                        };
                    }));
                }

                if ((element === scope || element === `${scope}_RUN`) &&
                    ['PASSED', 'FAILED', 'ABORTED', 'ERROR', 'SUCCESS', 'FAILURE'].includes(status)) {
                    eventSource.close();
                    setIsRunning(false);
                    isStartingRef.current = false;
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
                            (testcaseRunId && String((tc as any).runId) === testcaseRunId) ||
                            (testcaseRunId && String(runId) === testcaseRunId && prev.length === 1);

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

                        
                        const currentActiveId = activeCaseIdRef.current;
                        const isCurrentlyViewed = currentActiveId ? String(tc.id) === String(currentActiveId) : true;

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
    }, []);

    useEffect(() => {
        const parentSuiteRunId = location.state?.parentSuiteRunId;
        const effectiveRunId = parentSuiteRunId || activeRunId;
        const effectiveScope = parentSuiteRunId ? 'TESTSUITE' : runScope;

        if (effectiveRunId && effectiveScope && isRunning) {
            console.log(`[SSE] Managing connection for run ${effectiveRunId} (${effectiveScope})`);
            subscribeToRun(effectiveRunId, effectiveScope);
        }
    }, [activeRunId, runScope, subscribeToRun, location.state?.parentSuiteRunId, isRunning]);

    
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                console.log('[SSE] Cleaning up connection on unmount');
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (caseId) {
            setActiveCaseId(caseId);
        } else if (!activeCaseId && testCases && testCases.length > 0) {
            setActiveCaseId(String(testCases[0].id));
        }
    }, [caseId, testCases, activeCaseId]);

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

                let rId = location.state?.runId ? Number(location.state.runId) : undefined;
                let scope = (location.state?.scope as Scope) || 'TESTSUITE';

                
                try {
                    if (!rId && suiteId) {
                        const suiteRuns = await runService.getTestSuiteRuns(projectId, suiteId, 0, 1);
                        const latestSuite = suiteRuns.runs[0];
                        if (latestSuite && (latestSuite.status === 'RUNNING' || latestSuite.status === 'QUEUED')) {
                            rId = latestSuite.id;
                            scope = 'TESTSUITE';
                        }
                    }
                } catch (err) {
                    console.warn("Failed to auto-reconnect to active runs:", err);
                }

                if (rId) {
                    setActiveRunId(rId);
                    setRunScope(scope);
                }

                const currentRunId = rId;
                const currentScope = scope;
                const parentSuiteRunId = location.state?.parentSuiteRunId;

                if (currentRunId) {
                    try {
                        let runDetails: any;
                        
                        if (parentSuiteRunId) {
                            runDetails = await runService.getTestSuiteRunDetails(parentSuiteRunId);
                        } else if (currentScope === 'TESTSUITE') {
                            runDetails = await runService.getTestSuiteRunDetails(currentRunId);
                        } else if (currentScope === 'TESTCASE') {
                            
                            try {
                                const tcr = await runService.getTestCaseRunDetails(currentRunId);
                                runDetails = { testcase_runs: [tcr], status: tcr.status };
                            } catch (e) {
                                console.warn("Failed to fetch individual test case details, awaiting live stream.");
                                runDetails = null;
                            }
                        }

                        if (runDetails && runDetails.testcase_runs) {
                            setTestCases(prev => prev.map(tc => {
                                const run = runDetails.testcase_runs.find((r: any) => String(r.testcase_id) === tc.id);

                                if (!run) return tc;

                                let status: TestCase['status'] = 'running';
                                const s = (run.status || '').toUpperCase();
                                if (['PASSED', 'EXECUTED', 'SUCCESS', 'COMPLETED', 'FINISHED'].includes(s)) status = 'passed';
                                else if (['FAILED', 'FAILURE', 'STOPPED'].includes(s)) status = 'failed';
                                else if (s === 'ABORTED') status = 'aborted';
                                else if (s === 'ERROR') status = 'error';
                                else if (['QUEUED', 'PENDING', 'IDLE'].includes(s)) status = 'idle';

                                const apiSteps = run.teststep_runs?.map((stepRun: any, idx: number) =>
                                    mapActiveStepToActionStep(stepRun, idx)
                                ) || [];
                                let finalSteps = (tc.steps || []);
                                if (apiSteps.length > 0) {
                                    finalSteps = apiSteps;
                                } else if (status === 'running') {
                                    finalSteps = [];
                                }

                                return {
                                    ...tc,
                                    status,
                                    terminationReason: run.termination_reason || tc.terminationReason,
                                    runId: run.id,
                                    steps: finalSteps
                                };
                            }));

                            if (['PASSED', 'FAILED', 'ABORTED', 'ERROR', 'SUCCESS', 'FAILURE'].includes(runDetails.status)) {
                                setIsRunning(false);
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
    }, [projectId, suiteId, caseId, location.state?.runId, location.state?.scope, location.state?.parentSuiteRunId, subscribeToRun]);

    const lastInitializedKey = useRef<string | null>(null);

    
    useEffect(() => {
        if (!activeCaseId) return;

        const tc = testCases.find(t => String(t.id) === String(activeCaseId));
        if (!tc || !tc.runId) return;

        const initializationKey = `${activeCaseId}-${tc.runId}`;
        if (lastInitializedKey.current === initializationKey) return;

        lastInitializedKey.current = initializationKey;

        
        if (tc.steps && tc.steps.length > 0 && ('status' in tc.steps[0])) {
            const lastStep = tc.steps[tc.steps.length - 1] as ActionStep;
            if (lastStep.screenshot) setCurrentScreenshot(lastStep.screenshot);
            setCurrentUrl(tc.url || '');
            setSelectedStep(lastStep);
            return;
        }

        
        
        runService.getTestCaseRunDetails(Number(tc.runId)).then((details: any) => {
            if (details?.teststep_runs && Array.isArray(details.teststep_runs) && details.teststep_runs.length > 0) {
                const apiSteps = details.teststep_runs.map((stepRun: any, idx: number) =>
                    mapActiveStepToActionStep(stepRun, idx)
                );

                setTestCases(current => current.map(t => String(t.id) === String(activeCaseId) ? { ...t, steps: apiSteps } : t));

                const lastStep = apiSteps[apiSteps.length - 1];
                if (lastStep.screenshot) setCurrentScreenshot(lastStep.screenshot);
                setCurrentUrl(tc.url || '');
                setSelectedStep(lastStep);
            }
        }).catch(() => {
            
        });
    }, [activeCaseId, testCases]);

    const handleSaveTestCase = useCallback(async (data: any) => {
        if (!projectId || !suiteId) return;
        setModalLoading(true);
        setModalError(null);
        try {
            if (editingTestCase) {
                const updated = await testCaseService.updateTestCase(projectId, suiteId, editingTestCase.id, {
                    ...editingTestCase,
                    ...data
                });
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

    const handleRunAllTests = useCallback(async (llmModelId?: number, options?: { useScreenshots: boolean; useVideo: boolean }) => {
        if (!projectId || !suiteId || isStartingRef.current) return;
        isStartingRef.current = true;
        setIsRunning(true);
        try {
            const run = await runService.startTestSuiteRun(
                parseInt(suiteId), 
                'NATURAL', 
                llmModelId,
                options?.useScreenshots,
                options?.useVideo
            );
            const details = await runService.getTestSuiteRunDetails(run.run_id);

            setActiveRunId(run.run_id);
            setRunScope('TESTSUITE');
            setTestCases(prev => prev.map(tc => {
                const caseRun = details.testcase_runs?.find((r: any) => String(r.testcase_id) === String(tc.id));
                return {
                    ...tc,
                    status: 'running',
                    runId: caseRun?.id || undefined,
                    steps: []
                };
            }));
        } catch (err: any) {
            setIsRunning(false);
            isStartingRef.current = false;
            setError(err.response?.data?.detail || 'Failed to start the run.');
        }
    }, [projectId, suiteId, subscribeToRun]);

    const handleRunSingleTest = useCallback(async (testId: string, llmModelId?: number, options?: { useScreenshots: boolean; useVideo: boolean }) => {
        if (isStartingRef.current) return;
        isStartingRef.current = true;
        setIsRunning(true);
        try {
            const run = await runService.startTestCaseRun(
                parseInt(testId), 
                'NATURAL', 
                llmModelId,
                options?.useScreenshots,
                options?.useVideo
            );
            setActiveRunId(run.run_id);
            setRunScope('TESTCASE');

            setTestCases(prev => prev.map(tc => {
                if (tc.id === testId) {
                    return { ...tc, status: 'running', runId: run.run_id, steps: [] };
                }
                return tc;
            }));
        } catch (err: any) {
            setIsRunning(false);
            isStartingRef.current = false;
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
            if (!tc) return;
            const sId = suiteId || tc.suiteId;
            if (!sId) return;

            
            await testCaseService.updateTestCase(projectId, sId, testId, {
                ...tc,
                prompt: newInstruction,
                plainText: newInstruction
            });

            setTestCases(prev => prev.map(tc =>
                tc.id === testId ? { ...tc, prompt: newInstruction, plainText: newInstruction } : tc
            ));
        } catch (err) {
            console.error("Failed to update instruction:", err);
            setError("Failed to update instruction.");
        }
    }, [projectId, suiteId, testCases]);

    const handleStepTextChange = useCallback(async (testId: string, stepId: string, newText: string) => {
        if (!projectId) return;
        try {
            const testCase = testCases.find(tc => tc.id === testId);
            if (!testCase) return;
            const sId = suiteId || testCase.suiteId;
            if (!sId) return;

            const updatedSteps = (testCase.steps || []).map(s => s.id === stepId ? { ...s, text: newText } : s);

            
            await testCaseService.updateTestCase(projectId, sId, testId, {
                ...testCase,
                steps: updatedSteps
            });

            setTestCases(prev => prev.map(tc => tc.id === testId ? { ...tc, steps: updatedSteps as ActionStep[] } : tc));
        } catch (err) {
            console.error("Failed to update step text:", err);
            setError("Failed to update step text.");
        }
    }, [projectId, suiteId, testCases]);

    const handleStepClick = useCallback((step: any, tc: TestCase) => {
        setActiveCaseId(tc.id);
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
        activeCaseId, setActiveCaseId,
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
