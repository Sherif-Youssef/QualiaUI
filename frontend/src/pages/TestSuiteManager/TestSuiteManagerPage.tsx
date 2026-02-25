import React, { useEffect, useRef, useState } from 'react';
import { TestSuiteManager } from '@/components/TestSuiteManager';
import { ScreenshotViewer } from '@/components/ScreenshotViewer';
import { AddTestCaseModal } from '@/components/Modal/AddTestCaseModal';
import { TestCase, ActionStep } from '@/types';

// Sub-components
import { TestSuiteManagerLayout } from './TestSuiteManagerLayout';

interface BackendAction {
    timestamp: string;
    reasoning?: string;
    success?: boolean;
    error?: string;
    recreation_prompt?: string;
    screenshot?: string;
}

export const TestSuiteManagerPage: React.FC = () => {
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [currentScreenshot, setCurrentScreenshot] = useState('');
    const [currentUrl, setCurrentUrl] = useState('');
    const [zoomLevel, setZoomLevel] = useState(100);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const socket = new WebSocket('ws://backend-url/ws');
        socketRef.current = socket;

        socket.onmessage = (event) => {
            const data: { test_id: string; action: BackendAction } = JSON.parse(event.data);

            setTestCases(prev =>
                prev.map(tc => {
                    if (tc.id !== data.test_id) return tc;

                    const steps = tc.steps || [];
                    const newStep: ActionStep = {
                        id: crypto.randomUUID(),
                        number: steps.length + 1,
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
                        steps: [...steps, newStep],
                    };
                })
            );
        };

        return () => socket.close();
    }, []);

    const handleSaveTestCase = (data: { name: string; url: string; mode: 'plain' | 'step-based' }) => {
        const id = crypto.randomUUID();
        setTestCases(prev => [
            ...prev,
            {
                id,
                name: data.name,
                url: data.url,
                prompt: data.mode === 'plain' ? 'Plain test' : 'Step-based test', // Simplified for this view
                status: 'idle',
                steps: [] as ActionStep[],
            },
        ]);
        setIsModalOpen(false);
    };

    const handleRunAllTests = async () => {
        const idleTests = testCases.filter(tc => tc.status === 'idle');

        for (const tc of idleTests) {
            setTestCases(prev =>
                prev.map(t => (t.id === tc.id ? { ...t, status: 'running', steps: [] } : t))
            );

            await fetch('api/v1/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: tc.url,
                    prompt: tc.prompt,
                }),
            });
        }
    };

    const handleStepClick = (step: ActionStep, testCase: TestCase) => {
        setCurrentScreenshot(step.screenshot || '');
        setCurrentUrl(testCase.url || '');
    };

    return (
        <TestSuiteManagerLayout
            sidebar={
                <TestSuiteManager
                    testCases={testCases}
                    onAddTestCase={() => setIsModalOpen(true)}
                    onRunAllTests={handleRunAllTests}
                    onRunSingleTest={(id) => console.log('Run single test', id)}
                    onEditTestCase={(tc) => console.log('Edit test case', tc)}
                    onInstructionChange={(testId, newInstruction) =>
                        setTestCases(prev =>
                            prev.map(tc => (tc.id === testId ? { ...tc, prompt: newInstruction } : tc))
                        )
                    }
                    onStepTextChange={(testId, stepId, newText) =>
                        setTestCases(prev =>
                            prev.map(tc =>
                                tc.id === testId
                                    ? { ...tc, steps: (tc.steps || []).map(s => (s.id === stepId ? { ...s, text: newText } : s)) }
                                    : tc
                            )
                        )
                    }
                    onStepClick={handleStepClick}
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
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveTestCase}
                />
            }
        />
    );
};
