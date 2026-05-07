import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, XCircle, AlertCircle, StopCircle, Loader2, Play, Pencil, FileText } from 'lucide-react';
import { TestCaseCard } from '@/components/TestCaseCard';
import { ScreenshotViewer } from '@/components/ScreenshotViewer';
import { ErrorMessage } from '@/components/GeneralComponents';
import { TestSuiteManagerLayout } from '../TestSuiteManager/TestSuiteManagerLayout';
import { TestSuiteManagerLoading } from '../TestSuiteManager/TestSuiteManagerLoading';
import { useTestCaseRun } from './hooks/useTestCaseRun';
import { ModelSelector } from '@/components/ModelSelector';
import { Button } from '@/components/ui/button';
import { ViewPromptModal } from '@/components/Modal/ViewPromptModal';
import { AddTestCaseModal } from '@/components/Modal/AddTestCaseModal';
import { testCaseService } from '@/services/testCase/testCaseService';

export const TestCaseRunPage: React.FC = () => {
    const { projectId, suiteId, caseId } = useParams<{ projectId: string; suiteId?: string; caseId?: string }>();
    const [selectedModel, setSelectedModel] = useState('gemini-1.5-pro');
    const [isViewPromptModalOpen, setIsViewPromptModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    const {
        testCase,
        currentScreenshot, setCurrentScreenshot,
        currentUrl,
        zoomLevel, setZoomLevel,
        isLoading,
        error,
        isRunning,
        isAborting,
        isSuiteRun,
        isReadOnly,
        selectedStep,
        setSelectedStep,
        handleRunTest,
        handleAbort,
        handleBack
    } = useTestCaseRun({ projectId, suiteId, caseId });

    const handleSaveTestCase = async (data: any) => {
        if (!projectId || !caseId || !testCase) return;
        setIsSaving(true);
        setModalError(null);
        try {
            await testCaseService.updateTestCase(projectId, suiteId || '0', caseId, {
                ...testCase,
                ...data
            });
            setIsEditModalOpen(false);
            window.location.reload(); // Refresh to get updated data
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to update test case');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <TestSuiteManagerLoading />;

    return (
        <TestSuiteManagerLayout
            error={error && <ErrorMessage message={error} />}
            sidebar={
                <aside className="w-full lg:w-[400px] xl:w-[450px] bg-white border-r border-border flex flex-col h-full overflow-hidden shadow-sm z-10 text-left">
                    <div className="px-6 py-6 border-b border-border bg-white space-y-6">
                        <div className="flex items-center justify-between gap-4">
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

                            <div className="flex items-center gap-2">
                                {!isSuiteRun && !isReadOnly && (
                                    <>
                                        {isRunning ? (
                                            <Button
                                                onClick={handleAbort}
                                                disabled={isAborting}
                                                variant="destructive"
                                                className="h-9 px-4 rounded-xl font-bold shadow-lg shadow-red-100 flex items-center gap-2 transition-all active:scale-95 text-[10px] uppercase tracking-widest"
                                            >
                                                <StopCircle className="w-4 h-4" />
                                                {isAborting ? 'Aborting...' : 'Abort'}
                                            </Button>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <ModelSelector 
                                                    value={selectedModel} 
                                                    onChange={setSelectedModel}
                                                    className="w-[140px] h-9 text-[10px] font-black" 
                                                />
                                                <Button
                                                    onClick={() => handleRunTest(selectedModel)}
                                                    className="h-9 px-4 rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95 text-[10px] uppercase tracking-widest bg-primary hover:bg-primary/90 text-white"
                                                >
                                                    <Play className="w-4 h-4 fill-current" />
                                                    Run
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-sans font-black text-gray-900 truncate tracking-tight">
                                    {testCase?.name || 'Test Case Run'}
                                </h2>
                                {testCase && (
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
                                            title="Edit Case"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setIsViewPromptModalOpen(true)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
                                            title="View Prompt"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            {testCase && (
                                <div className="flex items-center gap-2">
                                    {(() => {
                                        const s = (testCase.status || '').toUpperCase();
                                        const isSuccess = ['PASSED', 'SUCCESS', 'EXECUTED'].includes(s);
                                        const isFailure = ['FAILED', 'FAILURE'].includes(s);
                                        const isError = s === 'ERROR';
                                        const isAborted = s === 'ABORTED';
                                        const isRunningStatus = s === 'RUNNING';

                                        const colors = isSuccess ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50' :
                                            isFailure ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-50' :
                                                isError ? 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50' :
                                                    isAborted ? 'bg-slate-100 text-slate-600 border-slate-200 shadow-slate-50' :
                                                        isRunningStatus ? 'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-50' :
                                                            'bg-gray-50 text-gray-400 border-gray-100 shadow-gray-50';

                                        return (
                                            <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm flex items-center gap-1.5 ${colors}`}>
                                                {isSuccess && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                {isFailure && <XCircle className="w-3.5 h-3.5" />}
                                                {isError && <AlertCircle className="w-3.5 h-3.5" />}
                                                {isAborted && <StopCircle className="w-3.5 h-3.5" />}
                                                {isRunningStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                                {s || 'Idle'}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {testCase && (
                            <TestCaseCard
                                testCase={testCase}
                                onStepClick={(step, tc) => {
                                    setSelectedStep(step);
                                    if (step.screenshot) setCurrentScreenshot(step.screenshot);
                                }}
                                onStepTextChange={(testId, stepId, newText) => {}}
                                isReadOnly={true}
                                selectedStepId={selectedStep ? String(selectedStep.id) : undefined}
                            />
                        )}
                    </div>
                </aside>
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
                    {testCase && (
                        <AddTestCaseModal
                            isOpen={isEditModalOpen}
                            onClose={() => setIsEditModalOpen(false)}
                            editingTestCase={testCase}
                            onSave={handleSaveTestCase}
                            isLoading={isSaving}
                            error={modalError}
                        />
                    )}
                    <ViewPromptModal
                        isOpen={isViewPromptModalOpen}
                        onClose={() => setIsViewPromptModalOpen(false)}
                        prompt={testCase?.plainText || testCase?.prompt || ''}
                    />
                </>
            }
        />
    );
};
