import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TestCase, ActionStep, Scope } from '@/types';
import { testCaseService } from '@/services/testCase/testCaseService';
import { runService } from '@/services/runService';
import { SuiteWithCases } from '@/components/TestSuiteManager';
import { mapActiveStepToActionStep } from '@/utils/mappers';
import { useTestSuiteRun } from './useTestSuiteRun';
import { useTestCaseOperations } from './useTestCaseOperations';

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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStep, setSelectedStep] = useState<ActionStep | null>(null);
    const [activeCaseId, setActiveCaseId] = useState<string | null>(caseId || null);
    const activeCaseIdRef = useRef<string | null>(caseId || null);

    useEffect(() => {
        activeCaseIdRef.current = activeCaseId;
    }, [activeCaseId]);

    const {
        isRunning, setIsRunning,
        setActiveRunId,
        setRunScope,
        isAborting,
        handleRunAllTests,
        handleRunSingleTest,
        handleAbortRun,
    } = useTestSuiteRun({
        projectId,
        suiteId,
        initialRunId: location.state?.runId || null,
        initialScope: location.state?.scope || null,
        initialIsRunning: !!location.state?.runId,
        parentSuiteRunId: location.state?.parentSuiteRunId,
        setTestCases,
        setCurrentScreenshot,
        setCurrentUrl,
        setSelectedStep,
        activeCaseIdRef,
        setError,
    });

    const {
        isModalOpen, setIsModalOpen,
        modalLoading,
        modalError, setModalError,
        editingTestCase, setEditingTestCase,
        handleSaveTestCase,
        handleInstructionChange,
        handleStepTextChange,
    } = useTestCaseOperations({
        projectId,
        suiteId,
        testCases,
        setTestCases,
        setError,
    });

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

                                const isSameRun = String(run.id) === String(tc.runId);
                                return {
                                    ...tc,
                                    status,
                                    terminationReason: run.termination_reason || (isSameRun ? tc.terminationReason : undefined),
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
    }, [projectId, suiteId, caseId, location.state?.runId, location.state?.scope, location.state?.parentSuiteRunId]);

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
