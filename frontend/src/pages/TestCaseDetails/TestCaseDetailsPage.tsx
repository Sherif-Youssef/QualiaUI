import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ErrorMessage } from '@/components/GeneralComponents';
import { AddTestCaseModal } from '@/components/Modal/AddTestCaseModal';

import { TestCaseDetailsLayout } from './TestCaseDetailsLayout';
import { ScreenshotViewer } from './ScreenshotViewer';
import { useTestCaseDetails } from './hooks/useTestCaseDetails';
import { TestCaseHeader } from './components/TestCaseHeader';
import { ExecutionStepsSidebar } from './components/ExecutionStepsSidebar';
import { ViewPromptModal } from '@/components/Modal/ViewPromptModal';

export const TestCaseDetailsPage: React.FC = () => {
    const { projectId, suiteId, caseId } = useParams<{ projectId: string; suiteId: string; caseId: string }>();
    const navigate = useNavigate();

    const {
        testCase,
        isLoading,
        error,
        selectedStepId,
        setSelectedStepId,
        isRunning,
        activeSteps,
        currentScreenshot,
        isAborting,
        runTestCase,
        abortTestCase,
        updateTestCase,
        terminationReason,
        finalStatus
    } = useTestCaseDetails({ projectId, suiteId, caseId });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewPromptModalOpen, setIsViewPromptModalOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState('gemini-1.5-pro');
    const [isSaving, setIsSaving] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(100);

    const handleSaveTestCase = async (data: any) => {
        setIsSaving(true);
        setModalError(null);
        try {
            await updateTestCase(data);
            setIsEditModalOpen(false);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || err.message || 'Failed to update test case.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Loading Details...</p>
            </div>
        );
    }

    if (error) return <div className="p-8"><ErrorMessage message={error} /></div>;
    if (!testCase) return <div className="p-8 text-center text-gray-500 font-bold">Test Case not found</div>;

    const displaySteps = (isRunning || activeSteps.length > 0)
        ? activeSteps
        : (testCase.steps && testCase.steps.length > 0 ? testCase.steps : (testCase.executionSteps || []));

    return (
        <TestCaseDetailsLayout>
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="bg-white border-b border-gray-100 shrink-0">
                    <div className="px-8 pt-4 pb-0">
                        <TestCaseHeader
                            title={testCase.name}
                            isRunning={isRunning}
                            isAborting={isAborting}
                            status={finalStatus}
                            onBack={() => navigate(`/project/${projectId}/suite/${suiteId}`)}
                            onEdit={() => setIsEditModalOpen(true)}
                            onViewPrompt={() => setIsViewPromptModalOpen(true)}
                            onRun={() => runTestCase(selectedModel)}
                            onAbort={abortTestCase}
                        />
                    </div>
                </div>
                <div className="flex-1 flex overflow-hidden min-h-0">
                    <ExecutionStepsSidebar
                        testCaseMode={testCase.mode || 'plain'}
                        plainText={testCase.plainText}
                        displaySteps={displaySteps}
                        selectedStepId={selectedStepId}
                        onSelectStep={setSelectedStepId}
                        onEditPrompt={() => setIsEditModalOpen(true)}
                        terminationReason={terminationReason || testCase.terminationReason}
                        selectedModel={selectedModel}
                        onModelChange={(val) => setSelectedModel(val)}
                        isRunning={isRunning}
                        status={finalStatus || testCase.status}
                    />
                    <main className="flex-1 flex flex-col overflow-hidden bg-gray-50/30 min-h-0">
                        <ScreenshotViewer
                            screenshot={displaySteps.find(s => String(s.id) === selectedStepId)?.screenshot || currentScreenshot || null}
                            number={displaySteps.findIndex(s => String(s.id) === selectedStepId) + 1}
                            zoomLevel={zoomLevel}
                            onZoomIn={() => setZoomLevel(prev => Math.min(prev + 25, 200))}
                            onZoomOut={() => setZoomLevel(prev => Math.max(prev - 25, 50))}
                            onResetZoom={() => setZoomLevel(100)}
                        />
                    </main>
                </div>
            </div>

            {testCase && (
                <AddTestCaseModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setModalError(null);
                    }}
                    editingTestCase={testCase}
                    onSave={handleSaveTestCase}
                    isLoading={isSaving}
                    error={modalError}
                />
            )}
            {testCase && (
                <ViewPromptModal
                    isOpen={isViewPromptModalOpen}
                    onClose={() => setIsViewPromptModalOpen(false)}
                    prompt={testCase.plainText || ''}
                />
            )}
        </TestCaseDetailsLayout>
    );
};
