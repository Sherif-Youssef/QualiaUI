import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TestSuiteManager } from '@/components/TestSuiteManager';
import { ScreenshotViewer } from '@/components/ScreenshotViewer';
import { AddTestCaseModal } from '@/components/Modal/AddTestCaseModal';
import { TestCase, ActionStep } from '@/types/test-case';
import { TestSuiteManagerLayout } from './TestSuiteManagerLayout';
import { testCaseService } from '@/services/testCase/testCaseService';
import { ErrorMessage } from '@/components/GeneralComponents';
import { TestExecutionService } from '@/services/testSuit/TestExecutionService';

interface BackendAction {
    timestamp: string;
    reasoning?: string;
    success?: boolean;
    error?: string;
    recreation_prompt?: string;
    screenshot?: string;
}

export const TestSuiteManagerPage: React.FC = () => {
    const { suiteId } = useParams<{ suiteId: string }>();
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
            if (!suiteId) return;
            setIsLoading(true);
            setError(null);
            try {
                const data = await testCaseService.getTestCases(suiteId);
                setTestCases(data);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load test cases.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTestCases();

        const socket = TestExecutionService.connectToWebSocket();
        socketRef.current = socket;

        socket.onmessage = (event) => {
            const data: { test_id: string; action: BackendAction } = JSON.parse(event.data);

            setTestCases(prev =>
                prev.map(tc => {
                    if (tc.id !== data.test_id) return tc;

                    const steps = tc.steps || [];
                    const newStep: ActionStep = {
                        id: crypto.randomUUID(),
                        number: (steps as any[]).length + 1,
                        text: data.action.reasoning || data.action.recreation_prompt || 'No description',
                        screenshot: data.action.screenshot ? `data:image/png;base64,${data.action.screenshot}` : '',
                        type: 'do',
                    };

                    const updatedStatus =
                        data.action.success === undefined
                            ? 'running'
                            : data.action.success
                                ? 'success'
                                : 'failure';

                    if (newStep.screenshot) setCurrentScreenshot(newStep.screenshot);
                    setCurrentUrl(tc.url || '');
                    return {
                        ...tc,
                        status: updatedStatus,
                        steps: [...steps, newStep] as ActionStep[],
                    };
                })
            );
        };

        return () => socket.close();
    }, [suiteId]);

    const handleSaveTestCase = async (data: { name: string; url: string; mode: 'plain' | 'step-based' }) => {
        if (!suiteId) return;
        setModalLoading(true);
        setModalError(null);
        try {
            const newCase = await testCaseService.createTestCase(suiteId, data);
            setTestCases(prev => [...prev, newCase]);
            setIsModalOpen(false);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to create test case.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleRunAllTests = async () => {
        const idleTests = testCases.filter(tc => tc.status === 'idle');

        for (const tc of idleTests) {
            setTestCases(prev =>
                prev.map(t => (t.id === tc.id ? { ...t, status: 'running', steps: [] } : t))
            );

            await TestExecutionService.executeTestCase(tc.url, tc.prompt || '');
        }
    };

    const handleStepClick = (step: ActionStep, testCase: TestCase) => {
        setCurrentScreenshot(step.screenshot || '');
        setCurrentUrl(testCase.url || '');
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium font-sans">Syncing Test Cases...</p>
            </div>
        );
    }

    return (
        <TestSuiteManagerLayout
            sidebar={
                <div className="flex flex-col h-full">
                    {error && <div className="p-4"><ErrorMessage message={error} /></div>}
                    <TestSuiteManager
                        testCases={testCases}
                        onAddTestCase={() => {
                            setModalError(null);
                            setIsModalOpen(true);
                        }}
                        onRunAllTests={handleRunAllTests}
                        onRunSingleTest={(id) => console.log('Run single test', id)}
                        onEditTestCase={(tc) => console.log('Edit test case', tc)}
                        onInstructionChange={async (testId, newInstruction) => {
                            try {
                                await testCaseService.updateTestCase(testId, { prompt: newInstruction });
                                setTestCases(prev =>
                                    prev.map(tc => (tc.id === testId ? { ...tc, prompt: newInstruction } : tc))
                                );
                            } catch (err) {
                                console.error("Failed to update instruction", err);
                            }
                        }}
                        onStepTextChange={async (testId, stepId, newText) => {
                            try {
                                const testCase = testCases.find(tc => tc.id === testId);
                                if (!testCase) return;
                                const updatedSteps = (testCase.steps || []).map(s =>
                                    s.id === stepId ? { ...s, text: newText } : s
                                );
                                await testCaseService.updateTestCase(testId, { steps: updatedSteps });
                                setTestCases(prev =>
                                    prev.map(tc =>
                                        tc.id === testId
                                            ? { ...tc, steps: updatedSteps as ActionStep[] }
                                            : tc
                                    )
                                );
                            } catch (err) {
                                console.error("Failed to update step text", err);
                            }
                        }}
                        onStepClick={handleStepClick}
                    />
                </div>
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
                    onClose={() => {
                        setIsModalOpen(false);
                        setModalError(null);
                    }}
                    onSave={handleSaveTestCase}
                    isLoading={modalLoading}
                    error={modalError}
                />
            }
        />
    );
};
