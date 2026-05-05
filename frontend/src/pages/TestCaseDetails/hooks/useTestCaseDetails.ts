import { useState, useEffect, useRef, useCallback } from 'react';
import { testCaseService } from '@/services/testCase/testCaseService';
import { runService } from '@/services/runService';
import { TestCase } from '@/types/test-case';
import { TestCaseRun } from '@/types/run';

interface UseTestCaseDetailsProps {
    projectId?: string;
    suiteId?: string;
    caseId?: string;
}

export const useTestCaseDetails = ({ projectId, suiteId, caseId }: UseTestCaseDetailsProps) => {
    const [testCase, setTestCase] = useState<TestCase | null>(null);
    const [history, setHistory] = useState<TestCaseRun[]>([]);
    const [activeView, setActiveView] = useState<'steps' | 'history'>('steps');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStepId, setSelectedStepId] = useState<string>('');
    const [isRunning, setIsRunning] = useState(false);
    const [activeRunId, setActiveRunId] = useState<number | null>(null);
    const [activeSteps, setActiveSteps] = useState<any[]>([]);
    const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);
    const [terminationReason, setTerminationReason] = useState<string | null>(null);
    const [finalStatus, setFinalStatus] = useState<'passed' | 'failed' | 'error' | null>(null);
    const [page, setPage] = useState(1);
    const limit = 6;
    const [totalRuns, setTotalRuns] = useState(0);

    const eventSourceRef = useRef<EventSource | null>(null);

    const syncStatus = useCallback((data: TestCase) => {
        const status = data.status?.toUpperCase();
        if (status === 'RUNNING') {
            setIsRunning(true);
        } else {
            setIsRunning(false);
            if (['PASSED', 'FAILED', 'ERROR', 'ABORTED', 'SUCCESS', 'FAILURE'].includes(status || '')) {
                setFinalStatus(status?.toLowerCase() as any);
            }
        }
    }, []);

    const fetchTestCase = useCallback(async () => {
        if (!caseId || !projectId || !suiteId) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await testCaseService.getTestCaseById(projectId, suiteId, caseId);
            setTestCase(data);
            syncStatus(data);

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
    }, [caseId, projectId, suiteId, syncStatus]);

    const refreshTestCaseSilent = useCallback(async () => {
        if (!caseId || !projectId || !suiteId) return;
        try {
            const data = await testCaseService.getTestCaseById(projectId, suiteId, caseId);
            setTestCase(data);
            syncStatus(data);
        } catch { }
    }, [caseId, projectId, suiteId, syncStatus]);

    useEffect(() => {
        fetchTestCase();
        return () => {
            if (eventSourceRef.current) eventSourceRef.current.close();
        };
    }, [fetchTestCase]);
    useEffect(() => {
        let interval: any;
        if (isRunning && !activeRunId) {
            interval = setInterval(() => {
                refreshTestCaseSilent();
            }, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, activeRunId, refreshTestCaseSilent]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!caseId || !projectId || !suiteId || activeView !== 'history') return;
            try {
                const result = await runService.getTestCaseRuns(projectId, suiteId, caseId, (page - 1) * limit, limit);
                setHistory(result.runs);
                setTotalRuns(result.total);
            } catch (err: any) {
                console.error('Failed to load test case history:', err);
            }
        };
        fetchHistory();
    }, [caseId, projectId, suiteId, activeView, page]);

    const updateTestCase = async (data: any) => {
        if (!projectId || !suiteId || !caseId) throw new Error("Missing parameters");
        await testCaseService.updateTestCase(projectId, suiteId, caseId, data);
        await fetchTestCase();
    };

    const runTestCase = async (model: string = 'gemini-1.5-pro') => {
        if (!projectId || !suiteId || !caseId) return;
        setIsRunning(true);
        setFinalStatus(null);
        setTerminationReason(null);
        setActiveSteps([]);
        setCurrentScreenshot(null);

        try {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            const run = await runService.startTestCaseRun(parseInt(caseId), 'NATURAL', model);
            setActiveRunId(run.run_id);
            const eventSource = runService.subscribeToRunProgress('TESTCASE', run.run_id, (data: any) => {
                const msgType: string = data.type || '';
                const eventPayload = typeof data.event === 'string' ? JSON.parse(data.event) : data.event;

                if (msgType === 'STATUS_CHANGE' && eventPayload) {
                    if (eventPayload.element === 'TESTCASE' && eventPayload.id === parseInt(caseId)) {
                        if (eventPayload.status === 'PASSED') setFinalStatus('passed');
                        else if (eventPayload.status === 'ERROR') setFinalStatus('error');
                        else if (['FAILED', 'ABORTED'].includes(eventPayload.status)) {
                            setFinalStatus('failed');
                        }

                        if (['FAILED', 'ERROR', 'ABORTED'].includes(eventPayload.status) && eventPayload.termination_reason) {
                            setTerminationReason(eventPayload.termination_reason);
                        }

                        if (['PASSED', 'FAILED', 'ERROR', 'ABORTED'].includes(eventPayload.status)) {
                            eventSource.close();
                            setIsRunning(false);
                            setIsAborting(false);
                            setActiveRunId(null);
                            refreshTestCaseSilent();
                        }
                    }
                }

                if (msgType === 'TEST_STEP' && eventPayload) {
                    const stepData = eventPayload;
                    const stepId = stepData.id || crypto.randomUUID();
                    const screenshotUrl = stepData.snapshot_after?.screenshot || stepData.snapshot_before?.screenshot || '';

                    const mappedStep = {
                        id: stepId,
                        number: 0,
                        text: JSON.stringify(stepData),
                        screenshot: screenshotUrl,
                        status: stepData.status?.toLowerCase() || 'pending'
                    };

                    setActiveSteps(prev => {
                        const stepExistsIndex = prev.findIndex(s => s.id === stepId);
                        let newSteps = [...prev];

                        if (stepExistsIndex >= 0) {
                            newSteps[stepExistsIndex] = { ...newSteps[stepExistsIndex], ...mappedStep };
                        } else {
                            const stepWithNumber = { ...mappedStep, number: prev.length + 1 };
                            newSteps.push(stepWithNumber);
                            if (prev.length === 0) setSelectedStepId(String(stepWithNumber.id));
                            if (stepWithNumber.screenshot) setCurrentScreenshot(stepWithNumber.screenshot);
                        }

                        return newSteps;
                    });
                }
            });
            eventSourceRef.current = eventSource;
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to start test run.');
            setIsRunning(false);
            setActiveRunId(null);
        }
    };

    const [isAborting, setIsAborting] = useState(false);

    const abortTestCase = async () => {
        if (!activeRunId) return;
        setIsAborting(true);
        try {
            await runService.abortTestCaseRun(activeRunId);
        } catch (err: any) {
            console.error("Failed to abort test case:", err);
            setIsAborting(false);
        }
    };

    return {
        testCase,
        history,
        activeView,
        setActiveView,
        isLoading,
        error,
        selectedStepId,
        setSelectedStepId,
        isRunning,
        activeSteps,
        currentScreenshot,
        page,
        setPage,
        limit,
        totalRuns,
        runTestCase,
        abortTestCase,
        updateTestCase,
        terminationReason,
        finalStatus,
        isAborting
    };
};
