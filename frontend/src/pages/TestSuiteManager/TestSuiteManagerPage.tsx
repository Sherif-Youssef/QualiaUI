import React from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, XCircle, AlertCircle, StopCircle, Loader2 } from 'lucide-react';
import { TestSuiteManager } from '@/components/TestSuiteManager';
import { ScreenshotViewer } from '@/components/ScreenshotViewer';
import { AddTestCaseModal } from '@/components/Modal/AddTestCaseModal';
import { ErrorMessage } from '@/components/GeneralComponents';
import { TestSuiteManagerLayout } from './TestSuiteManagerLayout';
import { TestSuiteManagerLoading } from './TestSuiteManagerLoading';
import { useTestSuiteManager } from './hooks/useTestSuiteManager';
import { TopNav } from '@/components/TopNav';


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
        activeCaseId,
        handleSaveTestCase,
        handleStepTextChange,
        handleStepClick,
        handleBack
    } = useTestSuiteManager({ projectId, suiteId, caseId });

    const activeTestCase = React.useMemo(() => {
        if (!testCases || testCases.length === 0) return null;
        return testCases.find(tc => String(tc.id) === String(activeCaseId)) || testCases[0];
    }, [testCases, activeCaseId]);

    if (isLoading) return <TestSuiteManagerLoading />;

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <TopNav />
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
                                            {(() => {
                                                const s = (activeTestCase.status || '').toUpperCase();
                                                const isSuccess = ['PASSED', 'SUCCESS', 'EXECUTED'].includes(s);
                                                const isFailure = ['FAILED', 'FAILURE'].includes(s);
                                                const isError = s === 'ERROR';
                                                const isAborted = s === 'ABORTED';
                                                const isRunning = s === 'RUNNING';

                                                const colors = isSuccess ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50' :
                                                    isFailure ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-50' :
                                                        isError ? 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50' :
                                                            isAborted ? 'bg-slate-100 text-slate-600 border-slate-200 shadow-slate-50' :
                                                                isRunning ? 'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-50' :
                                                                    'bg-gray-50 text-gray-400 border-gray-100 shadow-gray-50';

                                                return (
                                                    <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-1.5 ${colors}`}>
                                                        {isSuccess && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                        {isFailure && <XCircle className="w-3.5 h-3.5" />}
                                                        {isError && <AlertCircle className="w-3.5 h-3.5" />}
                                                        {isAborted && <StopCircle className="w-3.5 h-3.5" />}
                                                        {isRunning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                                        {s || 'Idle'}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    }
                    onStepTextChange={handleStepTextChange}
                    onStepClick={handleStepClick}
                    isReadOnly={false}
                    selectedStepId={selectedStep ? String(selectedStep.id) : undefined}
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
                </>
            }
        />
        </div>
    );
};
