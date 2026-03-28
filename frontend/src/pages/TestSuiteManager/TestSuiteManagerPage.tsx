import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TestSuiteManager } from '@/components/TestSuiteManager';
import { ScreenshotViewer } from '@/components/ScreenshotViewer';
import { AddTestCaseModal } from '@/components/Modal/AddTestCaseModal';
import { TestCase, ActionStep } from '@/types/test-case';
import { TestSuiteManagerLayout } from './TestSuiteManagerLayout';
import { testCaseService } from '@/services/testCase/testCaseService';
import { ErrorMessage } from '@/components/GeneralComponents';
import { runService } from '@/services/runs/runService';
import { mapActiveStepToActionStep } from '@/utils/mappers';
import { TestSuiteManagerLoading } from './TestSuiteManagerLoading';
import { ActiveTestStepRun } from '@/types/run';

export const TestSuiteManagerPage: React.FC = () => {
    const { projectId, suiteId } = useParams<{ projectId: string; suiteId: string }>();
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [currentScreenshot, setCurrentScreenshot] = useState('');
    const [currentUrl, setCurrentUrl] = useState('');
    const [zoomLevel, setZoomLevel] = useState(100);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const fetchTestCases = async () => {
            if (!projectId || !suiteId) return;
            setIsLoading(true);
            setError(null);
            try {
                const data = await testCaseService.getTestCases(projectId, suiteId, 0, 100);
                setTestCases(data.testCases);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load test cases.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTestCases();
        return () => { if (socketRef.current) socketRef.current.close(); };
    }, [projectId, suiteId]);

    const handleSaveTestCase = async (data: { name: string; url: string; mode: 'plain' | 'step-based' }) => {
        if (!projectId || !suiteId) return;
        setModalLoading(true);
        setModalError(null);
        try {
            const newCase = await testCaseService.createTestCase(projectId, suiteId, data);
            setTestCases(prev => [...prev, newCase]);
            setIsModalOpen(false);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to create test case.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleRunAllTests = async () => {
        if (!projectId || !suiteId) return;
        try {
            const run = await runService.startRun(projectId, suiteId);
            setTestCases(prev => prev.map(tc => ({ ...tc, status: 'running', steps: [] })));
            const socket = runService.subscribeToRun(projectId, run.run_id, (data: any) => {
                if (data.event === 'done') {
                    setTestCases(prev => prev.map(tc => 
                        tc.status === 'running' ? { ...tc, status: 'success' } : tc
                    ));
                    return;
                }
                if (data.event === 'error') {
                    setError(data.detail || 'Test execution encountered an error.');
                    return;
                }
                const stepRun = data as ActiveTestStepRun;
                setTestCases(prev => prev.map((tc, idx) => {
                    if (idx !== stepRun.index) return tc;
                    const steps = tc.steps || [];
                    const newStep = mapActiveStepToActionStep(stepRun, steps.length);
                    if (newStep.screenshot) setCurrentScreenshot(newStep.screenshot);
                    setCurrentUrl(tc.url || '');

                    let finalStatus = tc.status;
                    if (['FAILED', 'ERROR', 'ABORTED'].includes(stepRun.status)) {
                        finalStatus = 'failure';
                    } else if (tc.status === 'running' || tc.status === 'idle') {
                        finalStatus = 'running';
                    }

                    return {
                        ...tc,
                        status: finalStatus,
                        steps: [...steps, newStep] as ActionStep[],
                    };
                }));
            });
            socketRef.current = socket;
            socket.onclose = () => {};
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to start the run.');
        }
    };

    if (isLoading) return <TestSuiteManagerLoading />;

    return (
        <TestSuiteManagerLayout
            error={error && <ErrorMessage message={error} />}
            sidebar={
                <TestSuiteManager
                        testCases={testCases}
                        onAddTestCase={() => {
                            setModalError(null);
                            setIsModalOpen(true);
                        }}
                        onRunAllTests={handleRunAllTests}
                        onRunSingleTest={() => {}}
                        onEditTestCase={() => {}}
                        onInstructionChange={async (testId, newInstruction) => {
                            if (!projectId || !suiteId) return;
                            try {
                                await testCaseService.updateTestCase(projectId, suiteId, testId, { prompt: newInstruction });
                                setTestCases(prev => prev.map(tc => (tc.id === testId ? { ...tc, prompt: newInstruction } : tc)));
                            } catch (err) {}
                        }}
                        onStepTextChange={async (testId, stepId, newText) => {
                            if (!projectId || !suiteId) return;
                            try {
                                const testCase = testCases.find(tc => tc.id === testId);
                                if (!testCase) return;
                                const updatedSteps = (testCase.steps || []).map(s => s.id === stepId ? { ...s, text: newText } : s);
                                await testCaseService.updateTestCase(projectId, suiteId, testId, { steps: updatedSteps });
                                setTestCases(prev => prev.map(tc => tc.id === testId ? { ...tc, steps: updatedSteps as ActionStep[] } : tc));
                            } catch (err) {}
                        }}
                        onStepClick={(step, tc) => {
                            setCurrentScreenshot(step.screenshot || '');
                            setCurrentUrl(tc.url || '');
                        }}
                    />
            }
            content={
                <ScreenshotViewer
                    screenshot={currentScreenshot}
                    url={currentUrl}
                    zoomLevel={zoomLevel}
                    onZoomIn={() => setZoomLevel(z => Math.min(z + 25, 200))}
                    onZoomOut={() => setZoomLevel(z => Math.max(z - 25, 50))}
                    onResetZoom={() => setZoomLevel(100)}
                />
            }
            modals={
                <AddTestCaseModal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setModalError(null); }}
                    onSave={handleSaveTestCase}
                    isLoading={modalLoading}
                    error={modalError}
                />
            }
        />
    );
};
