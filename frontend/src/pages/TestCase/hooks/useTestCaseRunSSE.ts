import { useCallback, useRef } from 'react';
import { TestCase, ActionStep, Scope } from '@/types';
import { runService } from '@/services/runService';
import { mapActiveStepToActionStep } from '@/utils/mappers';

interface UseTestCaseRunSSEProps {
    caseId?: string;
    parentSuiteRunId?: string | number;
    setTestCase: React.Dispatch<React.SetStateAction<TestCase | null>>;
    setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
    setIsAborting: React.Dispatch<React.SetStateAction<boolean>>;
    setCurrentScreenshot: React.Dispatch<React.SetStateAction<string>>;
    setSelectedStep: React.Dispatch<React.SetStateAction<ActionStep | null>>;
    isStartingRef: React.MutableRefObject<boolean>;
    onSSEError?: (runId: number) => void;
}

export const useTestCaseRunSSE = ({
    caseId,
    parentSuiteRunId,
    setTestCase,
    setIsRunning,
    setIsAborting,
    setCurrentScreenshot,
    setSelectedStep,
    isStartingRef,
    onSSEError,
}: UseTestCaseRunSSEProps) => {
    const eventSourceRef = useRef<EventSource | null>(null);

    const closeStream = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
    }, []);

    const subscribeToRun = useCallback((runId: number) => {
        const subscriptionId = parentSuiteRunId ? Number(parentSuiteRunId) : runId;

        if (eventSourceRef.current) {
            if ((eventSourceRef.current as any).subscriptionId === subscriptionId) {
                return;
            }
            eventSourceRef.current.close();
        }
        setIsRunning(true);

        const scope = parentSuiteRunId ? 'TESTSUITE' : 'TESTCASE';

        const eventSource = runService.subscribeToRunProgress(
            scope as Scope,
            subscriptionId,
            (data: any) => {
                (eventSource as any).subscriptionId = subscriptionId;
                if (data.type === 'STATUS_CHANGE') {
                    const event = typeof data.event === 'string' ? JSON.parse(data.event) : data.event;
                    if (!event) return;

                    const eventId = String(event.id || '');
                    const eventTestCaseId = String(event.testcase_id || event.element_data?.testcase_id || '');

                    const isMatch = (eventId === String(runId)) ||
                        (eventId === String(caseId)) ||
                        (eventTestCaseId === String(caseId));

                    if (!isMatch) {
                        return;
                    }

                    const status = (event.status || '').toUpperCase();

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
                        eventSource.close();
                        setIsRunning(false);
                        isStartingRef.current = false;
                        setIsAborting(false);
                    }
                }

                if (data.type === 'TEST_STEP') {
                    const stepData = typeof data.event === 'string' ? JSON.parse(data.event) : data.event;
                    if (!stepData) return;

                    const eventRunId = String(stepData.testcase_run_id || stepData.run_id || '');
                    const eventTestCaseId = String(stepData.testcase_id || '');

                    const isMatch = (eventRunId === String(runId)) ||
                        (eventTestCaseId === String(caseId));

                    if (!isMatch) {
                        return;
                    }

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
                        setSelectedStep(finalStep);
                        return { ...prev, steps: newSteps };
                    });

                    if (incomingStep.screenshot) {
                        setCurrentScreenshot(incomingStep.screenshot);
                    }
                }
            },
            (err) => {
                console.error("[TestCaseRun] SSE stream error:", err);
                eventSource.close();
                setIsRunning(false);
                isStartingRef.current = false;
                setIsAborting(false);
                if (onSSEError) {
                    onSSEError(runId);
                } else {
                    setTestCase(prev => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            status: 'error',
                            terminationReason: prev.terminationReason || 'Connection to run progress stream lost.'
                        };
                    });
                }
            }
        );

        eventSourceRef.current = eventSource;
    }, [caseId, parentSuiteRunId, setTestCase, setIsRunning, setIsAborting, setCurrentScreenshot, setSelectedStep, isStartingRef, onSSEError]);

    return {
        subscribeToRun,
        closeStream,
    };
};
