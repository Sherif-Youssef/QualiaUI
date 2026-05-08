import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, XCircle, AlertCircle, StopCircle, Loader2, Play, Pencil, FileText } from 'lucide-react';
import { TestCaseCard } from '@/components/TestCaseCard';
import { ScreenshotViewer } from '@/components/ScreenshotViewer';
import { ErrorMessage } from '@/components/GeneralComponents';
import { TestSuiteManagerLayout } from '../../TestSuiteManager/TestSuiteManagerLayout';
import { TestSuiteManagerLoading } from '../../TestSuiteManager/TestSuiteManagerLoading';
import { useTestCaseRun } from '../hooks/useTestCaseRun';
import { Button } from '@/components/ui/button';
import { ViewPromptModal } from '@/components/Modal/ViewPromptModal';
import { AddTestCaseModal } from '@/components/Modal/AddTestCaseModal';
import { testCaseService } from '@/services/testCase/testCaseService';
import { RunConfigurationModal } from '@/components/Modal/RunConfigurationModal';

interface TestCaseRunViewProps {
    projectId?: string;
    suiteId?: string;
    caseId?: string;
    runId?: string;
    showBack?: boolean;
}

export const TestCaseRunView: React.FC<TestCaseRunViewProps> = ({
    projectId,
    suiteId,
    caseId,
    runId,
    showBack = true
}) => {
    const [isRunConfigModalOpen, setIsRunConfigModalOpen] = useState(false);
    const [isViewPromptModalOpen, setIsViewPromptModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

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
        handleBack,
        refreshTestCase
    } = useTestCaseRun({ projectId, suiteId, caseId, runId });

    const handleSaveTestCase = async (data: any) => {
        if (!projectId || !caseId || !testCase) return;
        setIsSaving(true);
        setModalError(null);
        try {
            const finalSuiteId = suiteId || (testCase as any).suiteId || (testCase as any).testsuite_id || '0';
            await testCaseService.updateTestCase(projectId, String(finalSuiteId), caseId, {
                ...testCase,
                ...data
            });
            await refreshTestCase();
            setIsEditModalOpen(false);
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
                            {showBack && (
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
                            )}

                            <div className="flex items-center gap-2 ml-auto">
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
                                            <Button
                                                onClick={() => setIsRunConfigModalOpen(true)}
                                                className="h-9 px-4 rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95 text-[10px] uppercase tracking-widest bg-primary hover:bg-primary/90 text-white"
                                            >
                                                <Play className="w-4 h-4 fill-current" />
                                                Run
                                            </Button>
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
                                            (isFailure || isError) ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-50' :
                                                isAborted ? 'bg-slate-100 text-slate-600 border-slate-200 shadow-slate-50' :
                                                    isRunningStatus ? 'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-50' :
                                                        'bg-gray-50 text-gray-400 border-gray-100 shadow-gray-50';

                                        return (
                                            <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm flex items-center gap-1.5 ${colors}`}>
                                                {isSuccess && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                {isFailure && <XCircle className="w-3.5 h-3.5" />}
                                                {isError && <XCircle className="w-3.5 h-3.5" />}
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

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {testCase?.terminationReason && (
                            <div className={`p-4 rounded-2xl border animate-in fade-in slide-in-from-top-2 duration-300 ${['passed', 'success', 'executed'].includes(testCase.status?.toLowerCase() || '')
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                                : testCase.status?.toLowerCase() === 'aborted'
                                    ? 'bg-slate-50 border-slate-100 text-slate-800'
                                    : 'bg-rose-50 border-rose-100 text-rose-800'
                                }`}>
                                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">
                                    Termination Reason
                                </h4>
                                <div className="relative">
                                    <p className={`text-sm font-medium leading-relaxed break-words whitespace-pre-wrap transition-all duration-300 ${!isExpanded ? 'line-clamp-3' : ''
                                        }`}>
                                        {testCase.terminationReason}
                                    </p>

                                    {(testCase.terminationReason.length > 150) && (
                                        <button
                                            onClick={() => setIsExpanded(!isExpanded)}
                                            className="mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-600 transition-all hover:underline flex items-center gap-1"
                                        >
                                            {isExpanded ? 'Show less' : 'Show more'}
                                        </button>


                                    )}
                                </div>
                            </div>
                        )}

                        {testCase && (
                            <TestCaseCard
                                testCase={testCase}
                                onStepClick={(step) => {
                                    setSelectedStep(step);
                                    if (step.screenshot) setCurrentScreenshot(step.screenshot);
                                }}
                                onStepTextChange={(testId, stepId, newText) => { }}
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
                    <RunConfigurationModal
                        isOpen={isRunConfigModalOpen}
                        onClose={() => setIsRunConfigModalOpen(false)}
                        onConfirm={(llmModelId) => {
                            handleRunTest(llmModelId);
                            setIsRunConfigModalOpen(false);
                        }}
                        title={`Run ${testCase?.name}`}
                    />
                </>
            }
        />
    );
};
