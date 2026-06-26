import { useState, useRef, useCallback, useEffect } from 'react';
import { TestCase, ActionStep, Scope } from '@/types';
import { runService } from '@/services/runService';
import { mapActiveStepToActionStep } from '@/utils/mappers';

interface UseTestSuiteRunProps {
    projectId?: string;
    suiteId?: string;
    initialRunId?: number | null;
    initialScope?: Scope | null;
    initialIsRunning?: boolean;
    parentSuiteRunId?: number;
    setTestCases: React.Dispatch<React.SetStateAction<TestCase[]>>;
    setCurrentScreenshot: (url: string) => void;
    setCurrentUrl: (url: string) => void;
    setSelectedStep: (step: ActionStep | null) => void;
    activeCaseIdRef: React.MutableRefObject<string | null>;
    setError: (error: string | null) => void;
}

export const useTestSuiteRun = ({
    projectId,
    suiteId,
    initialRunId,
    initialScope,
    initialIsRunning,
    parentSuiteRunId,
    setTestCases,
    setCurrentScreenshot,
    setCurrentUrl,
    setSelectedStep,
    activeCaseIdRef,
    setError,
}: UseTestSuiteRunProps) => {
    const [isRunning, setIsRunning] = useState<boolean>(!!initialIsRunning);
    const [activeRunId, setActiveRunId] = useState<number | null>(initialRunId || null);
    const [runScope, setRunScope] = useState<Scope | null>(initialScope || null);
    const [isAborting, setIsAborting] = useState(false);
    const isStartingRef = useRef(false);
    const eventSourceRef = useRef<EventSource | null>(null);

    const subscribeToRun = useCallback((runId: number, scope: Scope) => {
        if (eventSourceRef.current) {
            console.log(`[SSE] Closing previous connection before subscribing to new run ${runId}`);
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        setIsRunning(true);

        const eventSource = runService.subscribeToRunProgress(
            scope,
            runId,
            (data: any) => {
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
            },
            (err) => {
                console.error(`[SSE] SSE stream error for run ${runId}:`, err);
                eventSource.close();
                setIsRunning(false);
                isStartingRef.current = false;
                setIsAborting(false);
                setActiveRunId(null);

                const fetchFinalDetails = async () => {
                    try {
                        let finalTestCasesStatus: Record<string, { status: TestCase['status'], reason?: string, steps?: any[] }> = {};
                        if (scope === 'TESTSUITE') {
                            const details = await runService.getTestSuiteRunDetails(runId, true);
                            if (details && details.testcase_runs) {
                                details.testcase_runs.forEach((run: any) => {
                                    let status: TestCase['status'] = 'error';
                                    const s = (run.status || '').toUpperCase();
                                    if (['PASSED', 'EXECUTED', 'SUCCESS', 'COMPLETED', 'FINISHED'].includes(s)) status = 'passed';
                                    else if (['FAILED', 'FAILURE', 'STOPPED'].includes(s)) status = 'failed';
                                    else if (s === 'ABORTED') status = 'aborted';
                                    else if (s === 'ERROR') status = 'error';
                                    else if (['QUEUED', 'PENDING', 'IDLE'].includes(s)) status = 'idle';

                                    finalTestCasesStatus[String(run.testcase_id)] = {
                                        status,
                                        reason: run.termination_reason || undefined,
                                        steps: run.teststep_runs?.map((stepRun: any, idx: number) =>
                                            mapActiveStepToActionStep(stepRun, idx)
                                        )
                                    };
                                });
                            }
                        } else if (scope === 'TESTCASE') {
                            const tcr = await runService.getTestCaseRunDetails(runId, true);
                            if (tcr) {
                                let status: TestCase['status'] = 'error';
                                const s = (tcr.status || '').toUpperCase();
                                if (['PASSED', 'EXECUTED', 'SUCCESS', 'COMPLETED', 'FINISHED'].includes(s)) status = 'passed';
                                else if (['FAILED', 'FAILURE', 'STOPPED'].includes(s)) status = 'failed';
                                else if (s === 'ABORTED') status = 'aborted';
                                else if (s === 'ERROR') status = 'error';
                                else if (['QUEUED', 'PENDING', 'IDLE'].includes(s)) status = 'idle';

                                finalTestCasesStatus[String(tcr.testcase_id)] = {
                                    status,
                                    reason: tcr.termination_reason || undefined,
                                    steps: tcr.teststep_runs?.map((stepRun: any, idx: number) =>
                                        mapActiveStepToActionStep(stepRun, idx)
                                    )
                                };
                            }
                        }

                        setTestCases(prev => prev.map(tc => {
                            const finalInfo = finalTestCasesStatus[String(tc.id)];
                            if (finalInfo) {
                                let finalStatus = finalInfo.status;
                                let finalReason = finalInfo.reason;
                                if (['running', 'queued', 'pending', 'idle'].includes(finalStatus || '')) {
                                    finalStatus = 'error';
                                    finalReason = 'Connection to run progress stream lost. The backend execution may have crashed.';
                                }
                                return {
                                    ...tc,
                                    status: finalStatus,
                                    terminationReason: finalReason || tc.terminationReason,
                                    steps: finalInfo.steps && finalInfo.steps.length > 0 ? finalInfo.steps : tc.steps
                                };
                            }
                            if (tc.status === 'running' || tc.status === 'idle') {
                                return {
                                    ...tc,
                                    status: 'error',
                                    terminationReason: 'Connection to run progress stream lost.'
                                };
                            }
                            return tc;
                        }));
                    } catch (e) {
                        console.error("Failed to fetch final suite run details on SSE error:", e);
                        setTestCases(prev => prev.map(tc => {
                            if (tc.status === 'running' || tc.status === 'idle') {
                                return {
                                    ...tc,
                                    status: 'error',
                                    terminationReason: 'Connection to run progress stream lost.'
                                };
                            }
                            return tc;
                        }));
                    }
                };
                fetchFinalDetails();
            }
        );

        eventSourceRef.current = eventSource;
    }, []);

    useEffect(() => {
        const effectiveRunId = parentSuiteRunId || activeRunId;
        const effectiveScope = parentSuiteRunId ? 'TESTSUITE' : runScope;

        if (effectiveRunId && effectiveScope && isRunning) {
            console.log(`[SSE] Managing connection for run ${effectiveRunId} (${effectiveScope})`);
            subscribeToRun(effectiveRunId, effectiveScope);
        }
    }, [activeRunId, runScope, subscribeToRun, parentSuiteRunId, isRunning]);

    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                console.log('[SSE] Cleaning up connection');
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [suiteId, activeRunId]);

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
                    steps: [],
                    terminationReason: undefined
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
                    return { ...tc, status: 'running', runId: run.run_id, steps: [], terminationReason: undefined };
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

    return {
        isRunning, setIsRunning,
        activeRunId, setActiveRunId,
        runScope, setRunScope,
        isAborting,
        subscribeToRun,
        handleRunAllTests,
        handleRunSingleTest,
        handleAbortRun,
    };
};
