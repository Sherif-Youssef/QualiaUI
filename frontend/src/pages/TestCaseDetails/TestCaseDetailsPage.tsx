import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EditStepModal } from '@/components/Modal/EditStepModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmation';
import { TestStep, TestCase } from '@/types';
import { getTestCaseById, loadTestCases, saveTestCases } from '@/utils/testCaseStorage';

// Assets
import AmazonScreenshot from '@/assets/Images/image.png'
import talabatScreenshot from '@/assets/Images/image2.png'

// Sub-components
import { TestCaseDetailsLayout } from './TestCaseDetailsLayout';
import { StepsSidebar } from './StepsSidebar';
import { ScreenshotViewer } from './ScreenshotViewer';

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

    const handleDeleteStepClick = (stepId: string, stepText: string, e: React.MouseEvent) => {
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

    const handleEditStepClick = (step: TestStep, e: React.MouseEvent) => {
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
        <TestCaseDetailsLayout
            sidebar={
                <StepsSidebar
                    testCase={testCase}
                    steps={steps}
                    selectedStepId={selectedStepId}
                    onSelectStep={setSelectedStepId}
                    isRunning={isRunning}
                    onRun={handleRunTestCase}
                    finalStatus={finalStatus}
                    onEditStep={handleEditStepClick}
                    onDeleteStep={handleDeleteStepClick}
                />
            }
            content={
                <ScreenshotViewer
                    screenshot={selectedStep?.screenshot || null}
                    number={selectedStep?.number || 0}
                    zoomLevel={zoomLevel}
                    setZoomLevel={setZoomLevel}
                />
            }
            modals={
                <>
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
                </>
            }
        />
    );
};
