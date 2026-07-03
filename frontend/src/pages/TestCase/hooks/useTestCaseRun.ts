import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TestCase, ActionStep } from '@/types';
import { testCaseService } from '@/services/testCase/testCaseService';
import { runService } from '@/services/runService';
import { mapTestStepRunToActionStep } from '@/utils/mappers';
import { useTestCaseRunSSE } from './useTestCaseRunSSE';

interface UseTestCaseRunProps {
    projectId?: string;
    suiteId?: string;
    caseId?: string;
    runId?: string;
}

export const useTestCaseRun = ({ projectId, suiteId, caseId, runId: propRunId }: UseTestCaseRunProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const parentSuiteRunId = location.state?.parentSuiteRunId;
    const stateRunId = location.state?.runId;
    const startRun = location.state?.startRun;
    const model = location.state?.model;
    const [detectedSuiteRunId, setDetectedSuiteRunId] = useState<number | null>(null);
    const detectedSuiteRunIdRef = useRef<number | null>(null);
    const [testCase, setTestCase] = useState<TestCase | null>(null);
    const [currentScreenshot, setCurrentScreenshot] = useState('');
    const [currentUrl, setCurrentUrl] = useState('');
    const [zoomLevel, setZoomLevel] = useState(100);
    const [isLoading, setIsLoading] = useState(true);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const activeRunIdParam = propRunId || stateRunId;
    const [activeRunId, setActiveRunId] = useState<number | null>(activeRunIdParam ? Number(activeRunIdParam) : null);
    const [error, setError] = useState<string | null>(null);
    const [selectedStep, setSelectedStep] = useState<ActionStep | null>(null);
    const [isAborting, setIsAborting] = useState(false);

    const isStartingRef = useRef(false);

    const [runDetails, setRunDetails] = useState<any>(null);

    const handleSSEError = useCallback(async (runId: number) => {
        const streamErrorMessage = 'Connection to run progress stream lost. The backend execution may have crashed or timed out.';

        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            let currentStatus: TestCase['status'] = 'error';
            let reason = streamErrorMessage;
            let steps: ActionStep[] = [];
            const fullDetails = await runService.getTestCaseRunDetails(runId, true);
            if (fullDetails) {
                if (fullDetails.teststep_runs) {
                    steps = fullDetails.teststep_runs.map((s: any, i: number) => mapTestStepRunToActionStep(s, i));
                }
                currentStatus = (fullDetails.status?.toLowerCase() as TestCase['status']) || currentStatus;
                reason = fullDetails.termination_reason || reason;
            }
            if (['running', 'queued', 'pending', 'idle'].includes(currentStatus || '')) {
                currentStatus = 'error';
                if (!reason || reason === streamErrorMessage) {
                    reason = streamErrorMessage;
                }
            }
            setTestCase(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    status: currentStatus,
                    terminationReason: reason,
                    steps: steps.length > 0 ? steps : prev.steps
                };
            });
        } catch (err) {
            console.error("Failed to fetch final run details on SSE error:", err);
            setTestCase(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    status: 'error',
                    terminationReason: prev.terminationReason || streamErrorMessage
                };
            });
        }
    }, [parentSuiteRunId]);

    const { subscribeToRun, closeStream } = useTestCaseRunSSE({
        caseId,
        parentSuiteRunId: parentSuiteRunId || detectedSuiteRunId,
        detectedSuiteRunIdRef,
        setTestCase,
        setIsRunning,
        setIsAborting,
        setCurrentScreenshot,
        setSelectedStep,
        isStartingRef,
        onSSEError: handleSSEError,
    });

    const handleRunTest = useCallback(async (llmModelId?: number, options?: {
        useScreenshots: boolean;
        useVideo: boolean;
        timeout: number;
        shouldGroupActions: boolean;
    }) => {
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
                options?.useVideo,
                options?.timeout,
                options?.shouldGroupActions
            );
            setActiveRunId(run.run_id);
            setTestCase(prev => prev ? { ...prev, status: 'running', steps: [], terminationReason: undefined } : null);
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

    useEffect(() => {
        setTestCase(null);
        setCurrentScreenshot('');
        setCurrentUrl('');
        setSelectedStep(null);
        setError(null);
        setRunDetails(null);
        setActiveRunId(propRunId || stateRunId ? Number(propRunId || stateRunId) : null);
        setIsRunning(false);
        setIsAborting(false);
        const fetchInitialData = async () => {
            if (!projectId || !caseId) return;
            setIsLoading(true);
            try {
                const tcData = await testCaseService.getTestCaseById(projectId, suiteId || '0', caseId);
                let currentSteps = tcData.steps || [];
                let currentStatus = tcData.status;
                let reason = tcData.terminationReason;

                const runIdToFetch = propRunId || stateRunId || activeRunId;

                if (runIdToFetch) {
                    try {
                        const fullDetails = await runService.getTestCaseRunDetails(Number(runIdToFetch));
                        if (fullDetails) {
                            setRunDetails(fullDetails);
                            if (fullDetails.teststep_runs) {
                                currentSteps = fullDetails.teststep_runs.map((s: any, i: number) => mapTestStepRunToActionStep(s, i));
                            }
                            currentStatus = (fullDetails.status?.toLowerCase() as TestCase['status']) || currentStatus;
                            reason = fullDetails.termination_reason || undefined;

                            if (fullDetails.testsuite_run_id) {
                                detectedSuiteRunIdRef.current = fullDetails.testsuite_run_id;
                                setDetectedSuiteRunId(fullDetails.testsuite_run_id);
                            }
                        }

                        if (['running', 'queued', 'pending'].includes(currentStatus || '')) {
                            setIsRunning(true);
                            subscribeToRun(Number(runIdToFetch));
                        } else {
                            setIsRunning(false);
                        }
                    } catch (e) {
                        console.warn("Failed to fetch run details, assuming it's running and subscribing to stream:", e);
                        if (startRun || runIdToFetch) {
                            subscribeToRun(Number(runIdToFetch));
                        }
                    }
                }

                setTestCase(prev => {
                    const isSameCase = prev && String(prev.id) === String(caseId);
                    const finalSteps = (isSameCase && prev?.steps && prev.steps.length > 0) ? prev.steps : currentSteps;

                    return {
                        ...tcData,
                        status: currentStatus || (isSameCase ? prev?.status : null) || tcData.status,
                        terminationReason: runIdToFetch ? (reason || undefined) : (reason || (isSameCase ? prev?.terminationReason : undefined) || tcData.terminationReason),
                        steps: finalSteps
                    };
                });

                if (currentSteps.length > 0) {
                    const lastStep = currentSteps[currentSteps.length - 1] as ActionStep;
                    setSelectedStep(lastStep);
                    if (lastStep.screenshot) setCurrentScreenshot(lastStep.screenshot);
                }
                setCurrentUrl(tcData.url || '');

                if (startRun) {
                    handleRunTest(model || 'gemini-1.5-pro');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load test case');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [projectId, suiteId, caseId, propRunId, stateRunId, parentSuiteRunId, startRun, model, subscribeToRun, handleRunTest]);

    useEffect(() => {
        return () => {
            closeStream();
        };
    }, [caseId, closeStream]);

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
        isSuiteRun: !!parentSuiteRunId,
        isReadOnly: !!(propRunId || stateRunId) && !startRun,
        selectedStep,
        setSelectedStep,
        handleRunTest,
        handleAbort,
        handleBack: () => navigate(-1),
    };
};
