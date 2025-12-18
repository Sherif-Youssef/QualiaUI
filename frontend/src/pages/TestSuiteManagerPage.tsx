import React, { useState } from 'react';
import { TestSuiteManager } from '../components/TestSuiteManager';
import { ScreenshotViewer } from '../components/ScreenshotViewer';
import { TopMenuBar } from '../components/TopMenuBar';
import { AddTestCaseModal } from '../components/AddTestCaseModal';
import { TestCase, ActionStep, StepType } from '../types';
import screenshotimg from '../assets/Images/image.png';

export const TestSuiteManagerPage: React.FC = () => {

  const [testCases, setTestCases] = useState<TestCase[]>([
    {
      id: '1',
      name: 'Homepage Verification',
      instruction: 'Navigate to homepage and verify hero section',
      status: 'idle',
      url: 'https://example.com',
      steps: [
        { id: '1-1', number: 1, text: 'Open homepage', screenshot: screenshotimg },
        { id: '1-2', number: 2, text: 'Verify hero section is visible', screenshot: '' },
        { id: '1-3', number: 3, text: 'Check CTA button exists', screenshot: '' },
      ],
    },
    {
      id: '2',
      name: 'Login Flow Test',
      instruction: 'Test login flow with valid credentials',
      status: 'success',
      url: 'https://example.com/login',
      steps: [
        { id: '2-1', number: 1, text: 'Navigate to login page', screenshot: '' },
        { id: '2-2', number: 2, text: 'Enter username', screenshot: '' },
        { id: '2-3', number: 3, text: 'Enter password', screenshot: '' },
        { id: '2-4', number: 4, text: 'Click login button', screenshot: '' },
      ],
    },
    {
      id: '3',
      name: 'Product Search',
      instruction: 'Verify product search functionality',
      status: 'failure',
      url: 'https://xyz.com/search',
      steps: [
        { id: '3-1', number: 1, text: 'Open search bar', screenshot: '' },
        { id: '3-2', number: 2, text: 'Type product name', screenshot: '' },
        { id: '3-3', number: 3, text: 'Submit search', screenshot: '' },
      ],
    },
  ]);

  const [currentScreenshot, setCurrentScreenshot] = useState<string>('');
  const [currentUrl, setCurrentUrl] = useState<string>('https://abc.com');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);

  const handleAddTestCase = () => {
    setEditingTestCase(null);
    setIsModalOpen(true);
  };

  const handleEditTestCase = (testCase: TestCase) => {
    setEditingTestCase(testCase);
    setIsModalOpen(true);
  };

  const handleCreateTestCase = (data: {
    name: string;
    url: string;
    mode: 'do' | 'step-based';
    instruction?: string;
    steps?: Array<{ id: string; type: StepType; description: string; screenshot?: string }>;
  }) => {
    if (editingTestCase) {
      setTestCases(testCases.map(tc =>
        tc.id === editingTestCase.id
          ? {
              ...tc,
              name: data.name,
              instruction: data.mode === 'do' ? data.instruction! : tc.instruction,
              url: data.url,
              mode: data.mode,
            }
          : tc
      ));
    } else {
      const newTestCase: TestCase = {
        id: Date.now().toString(),
        name: data.name,
        instruction: data.mode === 'do' ? data.instruction! : 'Step-based test case',
        status: 'idle',
        url: data.url,
        mode: data.mode,
        steps:
          data.mode === 'step-based' && data.steps
            ? data.steps.map((step, index) => ({
                id: step.id,
                number: index + 1,
                text: `${step.type.toUpperCase()}: ${step.description}`,
                screenshot: step.screenshot || '.png',
                type: step.type,
              }))
            : [
                {
                  id: `${Date.now()}-1`,
                  number: 1,
                  text: data.instruction!,
                  screenshot: data.steps?.[0]?.screenshot || 'png',
                },
              ],
      };
      setTestCases([...testCases, newTestCase]);
    }
    setIsModalOpen(false);
    setEditingTestCase(null);
  };

  const handleRunAllTests = () => {
    setTestCases(testCases.map(tc => ({ ...tc, status: 'running' })));
    
    setTimeout(() => {
      setTestCases(testCases.map(tc => ({
        ...tc,
        status: Math.random() > 0.3 ? 'success' : 'failure',
      })));
    }, 2000);
  };

  const handleRunSingleTest = (testId: string) => {
    setTestCases(testCases.map(tc =>
      tc.id === testId ? { ...tc, status: 'running' } : tc
    ));

    setTimeout(() => {
      setTestCases(testCases.map(tc =>
        tc.id === testId
          ? { ...tc, status: Math.random() > 0.5 ? 'success' : 'failure' }
          : tc
      ));
    }, 1500);
  };

  const handleStepClick = (step: ActionStep, testCase: TestCase) => {
    setCurrentScreenshot(step.screenshot || '.png');
    setCurrentUrl(testCase.url || 'https://example.com/test-page');
  };

  const handleInstructionChange = (testId: string, newInstruction: string) => {
    setTestCases(testCases.map(tc =>
      tc.id === testId ? { ...tc, instruction: newInstruction } : tc
    ));
  };

  const handleStepTextChange = (testId: string, stepId: string, newText: string) => {
    setTestCases(testCases.map(tc =>
      tc.id === testId
        ? {
            ...tc,
            steps: tc.steps.map(step =>
              step.id === stepId ? { ...step, text: newText } : step
            ),
          }
        : tc
    ));
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopMenuBar/>
      
      <AddTestCaseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTestCase(null);
        }}
        onCreateTestCase={handleCreateTestCase}
        editingTestCase={editingTestCase}
      />
      
      <main className="flex h-[calc(100vh-64px)]">
        <TestSuiteManager
          testCases={testCases}
          onAddTestCase={handleAddTestCase}
          onRunAllTests={handleRunAllTests}
          onRunSingleTest={handleRunSingleTest}
          onEditTestCase={handleEditTestCase}
          onStepClick={handleStepClick}
          onInstructionChange={handleInstructionChange}
          onStepTextChange={handleStepTextChange}
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