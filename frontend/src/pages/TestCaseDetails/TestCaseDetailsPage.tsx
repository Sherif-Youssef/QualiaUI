import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EditStepModal } from '@/components/Modal/EditStepModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmation';
import { TestStep, TestCase } from '@/types/test-case';
import { testCaseService } from '@/services/testCase/testCaseService';
import { ErrorMessage } from '@/components/GeneralComponents';

// Sub-components
import { TestCaseDetailsLayout } from './TestCaseDetailsLayout';
import { StepsSidebar } from './StepsSidebar';
import { ScreenshotViewer } from './ScreenshotViewer';

export const TestCaseDetailsPage: React.FC = () => {
    const { caseId } = useParams<{ caseId: string }>();
    const navigate = useNavigate();
    const [testCase, setTestCase] = useState<TestCase | null>(null);
    const [selectedStepId, setSelectedStepId] = useState<string>('');
    const [editingStep, setEditingStep] = useState<TestStep | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; text: string } | null>(null);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [steps, setSteps] = useState<TestStep[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [finalStatus, setFinalStatus] = useState<'passed' | 'failed' | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTestCase = async () => {
            if (!caseId) return;

            setIsLoading(true);
            setError(null);
            try {
                const data = await testCaseService.getTestCaseById(caseId);
                setTestCase(data);
                const executionSteps = data.executionSteps || [];
                setSteps(executionSteps);
                if (data.status === 'passed' || data.status === 'failed') {
                    setFinalStatus(data.status);
                }

                if (executionSteps.length > 0 && !selectedStepId) {
                    setSelectedStepId(executionSteps[0].id);
                }
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load test case details.');
                console.error('Test case fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTestCase();
    }, [caseId]);

    const selectedStep = steps.find(s => s.id === selectedStepId);
    // removing the run as api endpoint is not ready yet
    // const handleRunTestCase = async () => {
    //     if (!testCase || !caseId) return;

    //     setIsRunning(true);
    //     setFinalStatus(null);
    //     try {
    //         console.log("Mocking execution for case:", caseId);
    //         setTimeout(() => {
    //             setFinalStatus('passed');
    //             setIsRunning(false);
    //         }, 3000);

    //     } catch (err) {
    //         console.error("Execution failed", err);
    //         setIsRunning(false);
    //     }
    // };

    const handleDeleteStepClick = (stepId: string, stepText: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActionError(null);
        setDeleteConfirmation({ id: stepId, text: stepText });
    };

    const confirmDeleteStep = async () => {
        if (!deleteConfirmation || !testCase || !caseId) return;

        setActionLoading(true);
        setActionError(null);
        try {
            const updatedSteps = steps.filter(s => s.id !== deleteConfirmation.id).map((step, index) => ({
                ...step,
                number: index + 1,
            }));

            await testCaseService.updateTestCase(caseId, { executionSteps: updatedSteps });

            setSteps(updatedSteps);
            if (selectedStepId === deleteConfirmation.id && updatedSteps.length > 0) {
                setSelectedStepId(updatedSteps[0].id);
            }
            setDeleteConfirmation(null);
        } catch (err: any) {
            setActionError(err.response?.data?.detail || 'Failed to delete step.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditStepClick = (step: TestStep, e: React.MouseEvent) => {
        e.stopPropagation();
        setActionError(null);
        setEditingStep(step);
    };

    const handleSaveStep = async (updatedText: string) => {
        if (editingStep && testCase && caseId) {
            setActionLoading(true);
            setActionError(null);
            try {

                const updatedSteps = steps.map(s =>
                    s.id === editingStep.id ? { ...s, text: updatedText } : s
                );
                await testCaseService.updateTestCase(caseId, { executionSteps: updatedSteps });

                setSteps(updatedSteps);
                setEditingStep(null);
            } catch (err: any) {
                setActionError(err.response?.data?.detail || 'Failed to update step.');
            } finally {
                setActionLoading(false);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium font-sans">Loading Test Case Details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <ErrorMessage message={error} />
                <button onClick={() => navigate(-1)} className="mt-4 text-primary font-medium hover:underline">
                    &larr; Go Back
                </button>
            </div>
        );
    }

    return (
        <TestCaseDetailsLayout
            sidebar={
                <StepsSidebar
                    testCase={testCase}
                    steps={steps}
                    selectedStepId={selectedStepId}
                    onSelectStep={setSelectedStepId}
                    isRunning={isRunning}
                    // onRun={/*{handleRunTestCase}*/}
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
                            isLoading={actionLoading}
                            error={actionError}
                        />
                    )}

                    <DeleteConfirmationModal
                        isOpen={deleteConfirmation !== null}
                        onClose={() => {
                            setDeleteConfirmation(null);
                            setActionError(null);
                        }}
                        onConfirm={confirmDeleteStep}
                        itemName={deleteConfirmation?.text || ""}
                        isLoading={actionLoading}
                        error={actionError}
                    />
                </>
            }
        />
    );
};
