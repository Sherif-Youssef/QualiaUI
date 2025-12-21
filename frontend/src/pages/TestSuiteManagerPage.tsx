import React, { useEffect, useRef, useState } from 'react';
import { TestSuiteManager } from '../components/TestSuiteManager';
import { ScreenshotViewer } from '../components/ScreenshotViewer';
import { TopMenuBar } from '../components/TopMenuBar';
import { AddTestCaseModal } from '../components/AddTestCaseModal';
import { TestCase, ActionStep } from '../types';

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

  /* WebSocket lifecycle*/
  useEffect(() => {
    const socket = new WebSocket('ws://backend-url/ws');
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data: { test_id: string; action: BackendAction } = JSON.parse(event.data);

      setTestCases(prev =>
        prev.map(tc => {
          if (tc.id !== data.test_id) return tc;

          const newStep: ActionStep = {
            id: crypto.randomUUID(),
            number: tc.steps.length + 1,
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
          setCurrentUrl(tc.url);

          return {
            ...tc,
            status: updatedStatus,
            steps: [...tc.steps, newStep],
          };
        })
      );
    };

    return () => socket.close();
  }, []);


  const handleAddTestCase = () => setIsModalOpen(true);

  const handleCreateTestCase = (data: { name: string; url: string; instruction: string }) => {
    const id = crypto.randomUUID();
    setTestCases(prev => [
      ...prev,
      {
        id,
        name: data.name,
        url: data.url,
        prompt: data.instruction,
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

  const handleZoomIn = () => setZoomLevel(z => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoomLevel(z => Math.max(z - 25, 50));
  const handleResetZoom = () => setZoomLevel(100);


  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopMenuBar />

      <AddTestCaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateTestCase={handleCreateTestCase}
      />

      <main className="flex h-[calc(100vh-64px)]">
        <TestSuiteManager
          testCases={testCases}
          onAddTestCase={handleAddTestCase}
          onRunAllTests={handleRunAllTests}
          onRunSingleTest={(testId) => console.log('Run single test', testId)}
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
                  ? { ...tc, steps: tc.steps.map(s => (s.id === stepId ? { ...s, text: newText } : s)) }
                  : tc
              )
            )
          }
          onStepClick={handleStepClick}
        />

        <ScreenshotViewer
          screenshot={currentScreenshot}
          url={currentUrl}
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
        />
      </main>
    </div>
  );
};
