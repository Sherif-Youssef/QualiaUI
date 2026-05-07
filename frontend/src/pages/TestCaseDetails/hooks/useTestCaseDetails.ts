import { useState, useEffect, useRef, useCallback } from 'react';
import { useRunStreaming } from '@/hooks/useRunStreaming';
import { testCaseService } from '@/services/testCase/testCaseService';
import { runService } from '@/services/runService';
import { TestCase } from '@/types/test-case';

interface UseTestCaseDetailsProps {
    projectId?: string;
    suiteId?: string;
    caseId?: string;
}

export const useTestCaseDetails = ({ projectId, suiteId, caseId }: UseTestCaseDetailsProps) => {
    const [testCase, setTestCase] = useState<TestCase | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStepId, setSelectedStepId] = useState<string>('');
    const [isRunning, setIsRunning] = useState(false);
    const [activeRunId, setActiveRunId] = useState<number | null>(null);
    const [activeSteps, setActiveSteps] = useState<any[]>([]);
    const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);
    const [terminationReason, setTerminationReason] = useState<string | null>(null);
    const [finalStatus, setFinalStatus] = useState<'passed' | 'failed' | 'error' | 'aborted' | 'executed' | null>(null);

    const isStartingRef = useRef(false);
    const [isAborting, setIsAborting] = useState(false);

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

    const refreshTestCaseSilent = useCallback(async () => {
        if (!caseId || !projectId || !suiteId) return;
        try {
            const data = await testCaseService.getTestCaseById(projectId, suiteId, caseId);
            setTestCase(data);
            syncStatus(data);
        } catch { }
    }, [caseId, projectId, suiteId, syncStatus]);

    const handleStatusChange = useCallback((eventPayload: any) => {
        if (eventPayload.element === 'TESTCASE' && String(eventPayload.id) === String(caseId)) {
            const status = eventPayload.status?.toUpperCase();
            if (status === 'PASSED' || status === 'SUCCESS') setFinalStatus('passed');
            else if (status === 'EXECUTED') setFinalStatus('executed');
            else if (status === 'ERROR') setFinalStatus('error');
            else if (status === 'ABORTED') setFinalStatus('aborted');
            else if (status === 'FAILED' || status === 'FAILURE') setFinalStatus('failed');

            if (['FAILED', 'ERROR', 'ABORTED', 'FAILURE'].includes(status)) {
                setTerminationReason(eventPayload.termination_reason || (status === 'ABORTED' ? 'Execution was aborted by the user.' : `Execution stopped with status: ${status}`));
            }

            if (['PASSED', 'FAILED', 'ERROR', 'ABORTED'].includes(status)) {
                setIsRunning(false);
                isStartingRef.current = false;
                setIsAborting(false);
                setActiveRunId(null);
                refreshTestCaseSilent();
            }
        }
    }, [caseId, refreshTestCaseSilent]);

    const handleStepUpdate = useCallback((stepData: any) => {
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
            const existIdx = prev.findIndex(s => s.id === stepId);
            const newSteps = [...prev];
            if (existIdx >= 0) {
                newSteps[existIdx] = { ...newSteps[existIdx], ...mappedStep };
            } else {
                const step = { ...mappedStep, number: prev.length + 1 };
                newSteps.push(step);
                if (prev.length === 0) setSelectedStepId(String(step.id));
                if (step.screenshot) setCurrentScreenshot(step.screenshot);
            }
            return newSteps;
        });
    }, []);

    useRunStreaming({
        scope: 'TESTCASE',
        runId: activeRunId,
        onStatusChange: handleStatusChange,
        onStepUpdate: handleStepUpdate
    });

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
            console.error('Error in fetchTestCase:', err);
            setError(err.response?.data?.detail || 'Failed to load test case details.');
        } finally {
            setIsLoading(false);
        }
    }, [caseId, projectId, suiteId, syncStatus]);

    useEffect(() => {
        fetchTestCase();
    }, [fetchTestCase]);


    const updateTestCase = async (data: any) => {
        if (!projectId || !suiteId || !caseId) throw new Error("Missing parameters");
        await testCaseService.updateTestCase(projectId, suiteId, caseId, data);
        await fetchTestCase();
    };

    const runTestCase = async (model: string = 'gemini-1.5-pro') => {
        if (!projectId || !suiteId || !caseId || isStartingRef.current) return;
        isStartingRef.current = true;
        setIsRunning(true);
        setFinalStatus(null);
        setTerminationReason(null);
        setActiveSteps([]);
        setCurrentScreenshot(null);

        try {
            const run = await runService.startTestCaseRun(parseInt(caseId), 'NATURAL', model);
            setActiveRunId(run.run_id);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to start test run.');
            setIsRunning(false);
            isStartingRef.current = false;
            setActiveRunId(null);
        }
    };

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
        isLoading,
        error,
        selectedStepId,
        setSelectedStepId,
        isRunning,
        activeSteps,
        currentScreenshot,
        runTestCase,
        abortTestCase,
        updateTestCase,
        terminationReason,
        finalStatus,
        isAborting
    };
};
