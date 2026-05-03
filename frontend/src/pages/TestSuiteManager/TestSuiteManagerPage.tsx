import React from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TestSuiteManager } from '@/components/TestSuiteManager';
import { ScreenshotViewer } from '@/components/ScreenshotViewer';
import { AddTestCaseModal } from '@/components/Modal/AddTestCaseModal';
import { ErrorMessage } from '@/components/GeneralComponents';
import { TestSuiteManagerLayout } from './TestSuiteManagerLayout';
import { TestSuiteManagerLoading } from './TestSuiteManagerLoading';
import { useTestSuiteManager } from './hooks/useTestSuiteManager';

export const TestSuiteManagerPage: React.FC = () => {
    const { projectId, suiteId, caseId } = useParams<{ projectId: string; suiteId?: string; caseId?: string }>();

    const {
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
        handleSaveTestCase,
        handleRunAllTests,
        handleInstructionChange,
        handleStepTextChange,
        handleStepClick,
        handleBack
    } = useTestSuiteManager({ projectId, suiteId, caseId });

    if (isLoading) return <TestSuiteManagerLoading />;

    return (
        <TestSuiteManagerLayout
            error={error && <ErrorMessage message={error} />}
            sidebar={
                <TestSuiteManager
                    testCases={testCases}
                    suites={suites}
                    header={
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={handleBack}
                                className="flex w-fit items-center gap-2 text-gray-400 hover:text-primary transition-all group/back"
                            >
                                <div className="w-6 h-6 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover/back:border-primary group-hover/back:text-primary transition-colors">
                                    <ArrowLeft className="w-3 h-3" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">
                                    {caseId ? 'Back to Test Case' : suiteId ? 'Back to Suite' : 'Back to Project'}
                                </span>
                            </button>
                            <h2 className="text-xl font-sans font-bold text-foreground">
                                {suiteId ? 'Suite Manager' : caseId ? 'Test Run Manager' : 'Project Manager'}
                            </h2>
                        </div>
                    }
                    onAddTestCase={() => {
                        setModalError(null);
                        setIsModalOpen(true);
                    }}
                    onRunAllTests={handleRunAllTests}
                    onRunSingleTest={() => { }}
                    onEditTestCase={(tc) => {
                        setEditingTestCase(tc);
                        setIsModalOpen(true);
                    }}
                    onInstructionChange={handleInstructionChange}
                    onStepTextChange={handleStepTextChange}
                    onStepClick={handleStepClick}
                />
            }
            content={
                <ScreenshotViewer
                    screenshot={currentScreenshot}
                    url={currentUrl}
                    selectedStep={selectedStep}
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
                        setEditingTestCase(null);
                    }}
                    editingTestCase={editingTestCase}
                    onSave={handleSaveTestCase}
                    isLoading={modalLoading}
                    error={modalError}
                />
            }
        />
    );
};
