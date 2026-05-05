import React from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TestSuiteManager } from '@/components/TestSuiteManager';
import { ScreenshotViewer } from '@/components/ScreenshotViewer';
import { AddTestCaseModal } from '@/components/Modal/AddTestCaseModal';
import { ViewPromptModal } from '@/components/Modal/ViewPromptModal';
import { ErrorMessage } from '@/components/GeneralComponents';
import { TestSuiteManagerLayout } from './TestSuiteManagerLayout';
import { TestSuiteManagerLoading } from './TestSuiteManagerLoading';
import { useTestSuiteManager } from './hooks/useTestSuiteManager';


export const TestSuiteManagerPage: React.FC = () => {
    const { projectId, suiteId, caseId } = useParams<{ projectId: string; suiteId?: string; caseId?: string }>();
    const [selectedModel] = React.useState('gemini-1.5-pro');
    const [isViewPromptModalOpen, setIsViewPromptModalOpen] = React.useState(false);

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
        isRunning,
        isAborting,
        handleSaveTestCase,
        handleRunAllTests,
        handleRunSingleTest,
        handleAbortRun,
        handleInstructionChange,
        handleStepTextChange,
        handleStepClick,
        handleBack
    } = useTestSuiteManager({ projectId, suiteId, caseId });

    const activeTestCase = React.useMemo(() => {
        if (!caseId) return null;
        return testCases.find(tc => tc.id === caseId) || testCases[0];
    }, [testCases, caseId]);

    if (isLoading) return <TestSuiteManagerLoading />;

    return (
        <TestSuiteManagerLayout
            error={error && <ErrorMessage message={error} />}
            sidebar={
                <TestSuiteManager
                    testCases={testCases}
                    suites={suites}
                    header={
                        <div className="space-y-4">
                            <div className="flex items-center w-full">
                                <button
                                    onClick={handleBack}
                                    className="flex shrink-0 items-center gap-2 text-gray-400 hover:text-primary transition-all group/back"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover/back:border-primary group-hover/back:text-primary transition-colors">
                                        <ChevronLeft className="w-5 h-5" />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] leading-none">
                                        Back
                                    </span>
                                </button>
                            </div>
                            <div className="flex items-center justify-between gap-4 min-w-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <h2 className="text-xl font-sans font-black text-gray-900 truncate tracking-tight" title={activeTestCase ? activeTestCase.name : ''}>
                                        {activeTestCase ? activeTestCase.name : suiteId ? 'Suite Manager' : 'Project Manager'}
                                    </h2>
                                    {activeTestCase && (
                                        <div className="flex items-center gap-2">
                                            <div className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${activeTestCase.status === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                activeTestCase.status === 'failure' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    activeTestCase.status === 'running' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                        'bg-gray-50 text-gray-500 border-gray-100'
                                                }`}>
                                                {activeTestCase.status}
                                            </div>
                                            <Button
                                                onClick={() => setIsViewPromptModalOpen(true)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2.5 rounded-lg text-primary hover:bg-primary hover:text-white font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 border border-primary/10 transition-all duration-200"
                                            >
                                                <FileText className="w-3 h-3" />
                                                Read Prompt
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    }
                    onAddTestCase={() => {
                        setModalError(null);
                        setIsModalOpen(true);
                    }}
                    onRunAllTests={() => handleRunAllTests(selectedModel)}
                    onAbortRun={handleAbortRun}
                    isRunning={isRunning}
                    isAborting={isAborting}
                    onRunSingleTest={(testId) => handleRunSingleTest(testId, selectedModel)}
                    onEditTestCase={(tc) => {
                        setEditingTestCase(tc);
                        setIsModalOpen(true);
                    }}
                    onInstructionChange={handleInstructionChange}
                    onStepTextChange={handleStepTextChange}
                    onStepClick={handleStepClick}
                    isReadOnly={false}
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
                <>
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
                    {activeTestCase && (
                        <ViewPromptModal
                            isOpen={isViewPromptModalOpen}
                            onClose={() => setIsViewPromptModalOpen(false)}
                            prompt={activeTestCase.plainText || ''}
                        />
                    )}
                </>
            }
        />
    );
};
