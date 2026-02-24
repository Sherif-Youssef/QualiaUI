import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Pencil, Trash2, ZoomIn, ZoomOut, RotateCcw, Play, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/button';
import { EditStepModal } from '../components/EditStepModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmation';
import { TestStep, TestCase } from '../types';
import { getTestCaseById, loadTestCases, saveTestCases } from '../utils/testCaseStorage';
import AmazonScreenshot from '../assets/Images/image.png'
import talabatScreenshot from '../assets/Images/image2.png'

export const TestCaseDetailsPage: React.FC = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string>('');
  const [editingStep, setEditingStep] = useState<TestStep | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; text: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [finalStatus, setFinalStatus] = useState<'passed' | 'failed' | null>(null);

  useEffect(() => {
    if (!caseId) return;

    const loadedTestCase = getTestCaseById(caseId);
    if (!loadedTestCase) {
      console.error('Test case not found');
      navigate(-1);
      return;
    }

    setTestCase(loadedTestCase);
    const executionSteps = loadedTestCase.executionSteps || [];
    setSteps(executionSteps);

    if (loadedTestCase.status === 'passed' || loadedTestCase.status === 'failed') {
      setFinalStatus(loadedTestCase.status);
    }

    if (executionSteps.length > 0 && !selectedStepId) {
      setSelectedStepId(executionSteps[0].id);
    }
  }, [caseId, navigate, selectedStepId]);

  const selectedStep = steps.find(s => s.id === selectedStepId);

  const handleRunTestCase = async () => {
    if (!testCase) return;

    setIsRunning(true);
    setFinalStatus(null);
    setSteps([]);
    setSelectedStepId('');

    const allTestCases = loadTestCases() || [];
    const updatedTestCases = allTestCases.map(tc =>
      tc.id === testCase.id ? { ...tc, status: 'running' as const, executionSteps: [] } : tc
    );
    saveTestCases(updatedTestCases);

    const mockSteps: TestStep[] = [
      { id: `${testCase.id}-1`, caseId: testCase.id, number: 1, text: 'Navigate to the page', screenshot: AmazonScreenshot, status: 'running' },
      { id: `${testCase.id}-2`, caseId: testCase.id, number: 2, text: 'Perform action', screenshot: talabatScreenshot, status: 'idle' },
      { id: `${testCase.id}-3`, caseId: testCase.id, number: 3, text: 'Verify result', screenshot: AmazonScreenshot, status: 'idle' },
      { id: `${testCase.id}-4`, caseId: testCase.id, number: 4, text: 'Complete test', screenshot: talabatScreenshot, status: 'idle' },
    ];

    for (let i = 0; i < mockSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const currentSteps = mockSteps.slice(0, i + 1).map((step, idx) => ({
        ...step,
        status: idx === i ? 'running' as const : 'passed' as const,
      }));

      setSteps(currentSteps);
      setSelectedStepId(currentSteps[i].id);

      const allCases = loadTestCases() || [];
      const updated = allCases.map(tc =>
        tc.id === testCase.id ? { ...tc, executionSteps: currentSteps, status: 'running' as const } : tc
      );
      saveTestCases(updated);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    const finalSteps = mockSteps.map(step => ({ ...step, status: 'passed' as const }));
    setSteps(finalSteps);
    setFinalStatus('passed');

    const allCases = loadTestCases() || [];
    const finalUpdate = allCases.map(tc =>
      tc.id === testCase.id ? { ...tc, executionSteps: finalSteps, status: 'passed' as const } : tc
    );
    saveTestCases(finalUpdate);
    setIsRunning(false);
  };

  const handleDeleteStep = (stepId: string, stepText: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmation({ id: stepId, text: stepText });
  };

  const confirmDeleteStep = () => {
    if (!deleteConfirmation || !testCase) return;

    const updatedSteps = steps.filter(s => s.id !== deleteConfirmation.id).map((step, index) => ({
      ...step,
      number: index + 1,
    }));
    setSteps(updatedSteps);

    const allTestCases = loadTestCases() || [];
    const updatedTestCases = allTestCases.map(tc =>
      tc.id === testCase.id ? { ...tc, executionSteps: updatedSteps } : tc
    );
    saveTestCases(updatedTestCases);

    if (selectedStepId === deleteConfirmation.id && updatedSteps.length > 0) {
      setSelectedStepId(updatedSteps[0].id);
    }

    setDeleteConfirmation(null);
  };

  const handleEditStep = (step: TestStep, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStep(step);
  };

  const handleSaveStep = (updatedText: string) => {
    if (editingStep && testCase) {
      const updatedSteps = steps.map(s =>
        s.id === editingStep.id ? { ...s, text: updatedText } : s
      );
      setSteps(updatedSteps);

      const allTestCases = loadTestCases() || [];
      const updatedTestCases = allTestCases.map(tc =>
        tc.id === testCase.id ? { ...tc, executionSteps: updatedSteps } : tc
      );
      saveTestCases(updatedTestCases);
      setEditingStep(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      <main className="flex h-[calc(100vh-64px)]">
        <aside className="w-[450px] bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-semibold text-gray-800">{testCase?.name || 'Test Case'}</h2>
                  {isRunning && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
                  {!isRunning && finalStatus === 'passed' && <CheckCircle2 className="w-5 h-5 text-success" />}
                  {!isRunning && finalStatus === 'failed' && <XCircle className="w-5 h-5 text-failure" />}
                </div>
                <p className="text-sm text-gray-500">Run Version: {testCase?.runVersion || 'N/A'}</p>
              </div>
              <Button onClick={handleRunTestCase} disabled={isRunning}>
                {isRunning ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Running...</>
                ) : (
                  <><Play className="w-4 h-4 mr-2" />Run Test Case</>
                )}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {steps.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No steps available</div>
            ) : (
              steps.map((step) => (
                <div
                  key={step.id}
                  onClick={() => setSelectedStepId(step.id)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer group ${selectedStepId === step.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white border-gray-200'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center">
                      {step.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 rounded flex items-center justify-center ${step.screenshot ? 'bg-primary/10' : 'bg-gray-100'}`}>
                          <Camera className={`w-5 h-5 ${step.screenshot ? 'text-primary' : 'text-gray-400'}`} />
                        </div>
                        <p className="flex-1 text-sm text-gray-700">{step.text}</p>
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={(e) => handleEditStep(step, e)} className="p-1.5 opacity-0 group-hover:opacity-100"><Pencil className="w-4 h-4" /></button>
                        <button onClick={(e) => handleDeleteStep(step.id, step.text, e)} className="p-1.5 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <section className="flex-1 bg-gray-50 flex flex-col">
          <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
            {selectedStep?.screenshot ? (
              <div className="relative">
                <img
                  src={selectedStep.screenshot}
                  alt={`Step ${selectedStep.number}`}
                  className="max-w-full max-h-full rounded-lg shadow-lg border border-gray-200"
                  style={{
                    transform: `scale(${zoomLevel / 100})`,
                    transition: 'transform 0.3s ease-in-out',
                  }}
                />
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <Camera className="w-16 h-16 mx-auto mb-4" />
                <p>No screenshot available</p>
              </div>
            )}
          </div>

          {/* FIXED: Added missing < bracket below */}
          <div className="p-6 border-t border-gray-200 bg-white">
            <div className="flex items-center justify-center gap-3">
              <Button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))} variant="outline" size="icon" disabled={zoomLevel <= 50}>
                <ZoomOut className="w-5 h-5" />
              </Button>
              <Button onClick={() => setZoomLevel(100)} variant="outline" size="icon">
                <RotateCcw className="w-5 h-5" />
              </Button>
              <Button onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))} variant="outline" size="icon" disabled={zoomLevel >= 200}>
                <ZoomIn className="w-5 h-5" />
              </Button>
              <span className="ml-4 text-sm text-gray-600 font-medium">{zoomLevel}%</span>
            </div>
          </div>
        </section>
      </main>

      {editingStep && (
        <EditStepModal
          step={editingStep}
          onSave={handleSaveStep}
          onCancel={() => setEditingStep(null)}
        />
      )}

      <DeleteConfirmationModal
        isOpen={deleteConfirmation !== null}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={confirmDeleteStep}
        itemName={deleteConfirmation?.text || ""}
      />
    </div>
  );
};