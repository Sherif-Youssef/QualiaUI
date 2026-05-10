import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TestCaseDTO, TestCase, ActionStep } from '@/types/test-case';
import { testCaseService } from '@/services/testCase/testCaseService';
import { runService } from '@/services/runService';
import { Scope } from '@/types/run';
import { mapActiveStepToActionStep, mapTestStepRunToActionStep, mapTestCaseToViewModel } from '@/utils/mappers';
import { getDeduplicated } from '@/lib/api';

interface UseTestCaseRunProps {
    projectId?: string;
    suiteId?: string;
    caseId?: string;
    runId?: string;
}

export const useTestCaseRun = ({ projectId, suiteId, caseId, runId: propRunId }: UseTestCaseRunProps) => {
    const location = useLocation();
    const navigate = useNavigate();

    const [testCase, setTestCase] = useState<TestCase | null>(null);
    const [currentScreenshot, setCurrentScreenshot] = useState('');
    const [currentUrl, setCurrentUrl] = useState('');
    const [zoomLevel, setZoomLevel] = useState(100);
    const [isLoading, setIsLoading] = useState(true);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    
    // Check runId from prop, then params (via prop in this case), then state
    const activeRunIdParam = propRunId || location.state?.runId;
    const [activeRunId, setActiveRunId] = useState<number | null>(activeRunIdParam ? Number(activeRunIdParam) : null);
    
    const [error, setError] = useState<string | null>(null);
    const [selectedStep, setSelectedStep] = useState<ActionStep | null>(null);
    const [isAborting, setIsAborting] = useState(false);

    const eventSourceRef = useRef<EventSource | null>(null);
    const isStartingRef = useRef(false);

    const [runDetails, setRunDetails] = useState<any>(null);

    const subscribeToRun = useCallback((runId: number) => {
        const parentSuiteRunId = location.state?.parentSuiteRunId;
        const subscriptionId = parentSuiteRunId ? Number(parentSuiteRunId) : runId;

        if (eventSourceRef.current) {
            // If already subscribed to this exact run, don't resubscribe
            if ((eventSourceRef.current as any).subscriptionId === subscriptionId) {
                return;
            }
            eventSourceRef.current.close();
        }
        setIsRunning(true);

        const scope = parentSuiteRunId ? 'TESTSUITE' : 'TESTCASE';

        console.log(`[TestCaseRun] Subscribing to ${scope} run ${subscriptionId} (Targeting TC Run ${runId})`);

        const eventSource = runService.subscribeToRunProgress(scope as Scope, subscriptionId, (data: any) => {
            (eventSource as any).subscriptionId = subscriptionId;
            if (data.type === 'STATUS_CHANGE') {
                const event = typeof data.event === 'string' ? JSON.parse(data.event) : data.event;
                if (!event) return;

                // For suite runs, only process events for THIS test case
                const eventId = String(event.id || '');
                const eventTestCaseId = String(event.testcase_id || event.element_data?.testcase_id || '');

                const isMatch = (eventId === String(runId)) ||
                    (eventId === String(caseId)) ||
                    (eventTestCaseId === String(caseId));

                if (parentSuiteRunId && !isMatch) {
                    return;
                }

                const status = (event.status || '').toUpperCase();
                console.log(`[TestCaseRun] Status change: ${status}`, event);

                const terminalReason = event.termination_reason || event.reason;

                let tcStatus: TestCase['status'] | null = null;
                if (['PASSED', 'SUCCESS', 'EXECUTED', 'COMPLETED', 'FINISHED'].includes(status)) tcStatus = 'passed';
                else if (['FAILED', 'FAILURE', 'STOPPED'].includes(status)) tcStatus = 'failed';
                else if (status === 'ABORTED') tcStatus = 'aborted';
                else if (status === 'ERROR') tcStatus = 'error';
                else if (status === 'RUNNING') tcStatus = 'running';

                setTestCase(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        status: tcStatus || prev.status,
                        terminationReason: terminalReason || prev.terminationReason,
                    };
                });

                if (['PASSED', 'FAILED', 'ABORTED', 'ERROR', 'SUCCESS', 'FAILURE', 'COMPLETED', 'FINISHED'].includes(status)) {
                    console.log(`[TestCaseRun] Closing stream for status: ${status}`);
                    eventSource.close();
                    setIsRunning(false);
                    isStartingRef.current = false;
                    setIsAborting(false);

                }
            }

            if (data.type === 'TEST_STEP') {
                const stepData = typeof data.event === 'string' ? JSON.parse(data.event) : data.event;
                if (!stepData) return;

                // For suite runs, only process events for THIS test case
                const eventRunId = String(stepData.testcase_run_id || stepData.run_id || '');
                const eventTestCaseId = String(stepData.testcase_id || '');

                const isMatch = (eventRunId === String(runId)) ||
                    (eventTestCaseId === String(caseId));

                if (parentSuiteRunId && !isMatch) {
                    return;
                }

                console.log(`[TestCaseRun] New step received:`, stepData);

                // Calculate mapped step outside to avoid closure issues with state updates
                // We'll determine the correct index/number inside the functional update
                const incomingStep = mapActiveStepToActionStep(stepData, 0);

                setTestCase(prev => {
                    if (!prev) return null;
                    const steps = prev.steps || [];
                    const stepExistsIndex = steps.findIndex(s => String(s.id) === String(stepData.id));
                    let newSteps = [...steps];

                    const finalStep = {
                        ...incomingStep,
                        number: stepExistsIndex >= 0 ? ((steps[stepExistsIndex] as any).number ?? stepExistsIndex) : steps.length
                    };

                    if (stepExistsIndex >= 0) {
                        newSteps[stepExistsIndex] = finalStep;
                    } else {
                        newSteps.push(finalStep);
                    }

                    return { ...prev, steps: newSteps };
                });

                // Update UI state immediately for live streaming effect
                if (incomingStep.screenshot) {
                    setCurrentScreenshot(incomingStep.screenshot);
                }
                setSelectedStep(incomingStep);
            }
        });

        eventSourceRef.current = eventSource;
    }, [caseId, location]);

    const handleRunTest = useCallback(async (llmModelId?: number, options?: { useScreenshots: boolean; useVideo: boolean }) => {
        if (!caseId || isStartingRef.current) return;
        isStartingRef.current = true;
        setIsRunning(true);
        setError(null);
        try {
            const run = await runService.startTestCaseRun(
                parseInt(caseId), 
                'NATURAL', 
                llmModelId,
                options?.useScreenshots,
                options?.useVideo
            );
            setActiveRunId(run.run_id);
            setTestCase(prev => prev ? { ...prev, status: 'running', steps: [] } : null);
            subscribeToRun(run.run_id);
        } catch (err: any) {
            setIsRunning(false);
            isStartingRef.current = false;
            setError(err.response?.data?.detail || 'Failed to start run');
        }
    }, [caseId, subscribeToRun]);

    const handleAbort = useCallback(async () => {
        if (!activeRunId) return;
        setIsAborting(true);
        try {
            await runService.abortTestCaseRun(activeRunId);
        } catch (err) {
            console.error(err);
            setIsAborting(false);
        }
    }, [activeRunId]);

    const refreshTestCase = useCallback(async () => {
        if (!projectId || !caseId) return;
        try {
            const finalSuiteId = suiteId || testCase?.suiteId || '0';
            const response = await getDeduplicated<TestCaseDTO>(
                `/projects/${projectId}/testsuites/${finalSuiteId}/testcases/${caseId}`,
                undefined,
                true
            );
            const updatedCase = mapTestCaseToViewModel(response.data);
            setTestCase(prev => {
                if (!prev) return updatedCase;
                return {
                    ...updatedCase,
                    status: (prev.status !== 'idle' && updatedCase.status === 'idle') ? prev.status : updatedCase.status,
                    steps: prev.steps && prev.steps.length > 0 ? prev.steps : updatedCase.steps,
                    terminationReason: updatedCase.terminationReason || prev.terminationReason
                };
            });
            setCurrentUrl(updatedCase.url || '');
        } catch (err: any) {
            console.error('Failed to refresh test case:', err);
        }
    }, [projectId, suiteId, caseId, testCase?.suiteId]);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!projectId || !caseId) return;
            setIsLoading(true);
            try {
                const tcData = await testCaseService.getTestCaseById(projectId, suiteId || '0', caseId);
                let currentSteps = tcData.steps || [];
                let currentStatus = tcData.status;
                let reason = tcData.terminationReason;

                const parentSuiteRunId = location.state?.parentSuiteRunId;
                const runIdToFetch = propRunId || location.state?.runId || activeRunId;

                if (runIdToFetch) {
                    try {
                        let runDetails: any;
                        // First try to get basic status from suite if available
                        if (parentSuiteRunId) {
                            try {
                                const suiteDetails = await runService.getTestSuiteRunDetails(Number(parentSuiteRunId));
                                runDetails = suiteDetails.testcase_runs?.find((r: any) => String(r.id) === String(runIdToFetch));
                                if (runDetails) {
                                    currentStatus = (runDetails.status?.toLowerCase() as TestCase['status']) || currentStatus;
                                }
                            } catch (e) {
                                console.warn("Failed to fetch suite details, falling back to case details");
                            }
                        }

                        // Always fetch individual details to get the test steps and screenshots
                        const fullDetails = await runService.getTestCaseRunDetails(Number(runIdToFetch));
                        if (fullDetails) {
                            setRunDetails(fullDetails);
                            if (fullDetails.teststep_runs) {
                                currentSteps = fullDetails.teststep_runs.map((s: any, i: number) => mapTestStepRunToActionStep(s, i));
                            }
                            currentStatus = (fullDetails.status?.toLowerCase() as TestCase['status']) || currentStatus;
                            reason = fullDetails.termination_reason || reason;
                        }

                        if (['running', 'queued', 'pending'].includes(currentStatus || '')) {
                            setIsRunning(true);
                            subscribeToRun(Number(runIdToFetch));
                        } else {
                            setIsRunning(false);
                        }
                    } catch (e) {
                        console.warn("Failed to fetch run details, assuming it's running and subscribing to stream:", e);
                        if (location.state?.startRun || runIdToFetch) {
                            subscribeToRun(Number(runIdToFetch));
                        }
                    }
                }

                setTestCase(prev => {
                    const finalSteps = (prev?.steps && prev.steps.length > 0) ? prev.steps : currentSteps;

                    return {
                        ...tcData,
                        status: currentStatus || prev?.status || tcData.status,
                        terminationReason: reason || prev?.terminationReason || tcData.terminationReason,
                        steps: finalSteps
                    };
                });

                if (currentSteps.length > 0) {
                    const lastStep = currentSteps[currentSteps.length - 1] as ActionStep;
                    setSelectedStep(lastStep);
                    if (lastStep.screenshot) setCurrentScreenshot(lastStep.screenshot);
                }
                setCurrentUrl(tcData.url || '');

                if (location.state?.startRun) {
                    handleRunTest(location.state.model || 'gemini-1.5-pro');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load test case');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [projectId, suiteId, caseId, propRunId, subscribeToRun, handleRunTest]);

    useEffect(() => {
        return () => {
            if (eventSourceRef.current) eventSourceRef.current.close();
        };
    }, []);

    return {
        testCase,
        runDetails,
        currentScreenshot, setCurrentScreenshot,
        currentUrl,
        zoomLevel, setZoomLevel,
        isLoading,
        error,
        isRunning,
        isAborting,
        isSuiteRun: !!location.state?.parentSuiteRunId,
        isReadOnly: !!(propRunId || location.state?.runId) && !location.state?.startRun,
        selectedStep,
        setSelectedStep,
        handleRunTest,
        handleAbort,
        handleBack: () => navigate(-1),
        refreshTestCase
    };
};
