import React from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
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
                                            <div className="flex items-center gap-2">
                                                <div className={`shrink-0 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.1em] border shadow-sm flex items-center gap-1.5 ${(activeTestCase.status === 'success' || activeTestCase.status === 'passed') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    (activeTestCase.status === 'failure' || activeTestCase.status === 'failed') ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                        activeTestCase.status === 'error' ? 'bg-red-50 text-red-600 border-red-100' :
                                                            activeTestCase.status === 'aborted' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                                activeTestCase.status === 'running' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                    'bg-gray-50 text-gray-500 border-gray-100'
                                                    }`}>
                                                    <div className={`w-1 h-1 rounded-full ${(activeTestCase.status === 'success' || activeTestCase.status === 'passed') ? 'bg-emerald-500' :
                                                        (activeTestCase.status === 'failure' || activeTestCase.status === 'failed') ? 'bg-rose-500' :
                                                            activeTestCase.status === 'error' ? 'bg-red-500' :
                                                                activeTestCase.status === 'aborted' ? 'bg-slate-500' :
                                                                    activeTestCase.status === 'running' ? 'bg-blue-500 animate-pulse' :
                                                                        'bg-gray-400'
                                                        }`} />
                                                    {(activeTestCase.status === 'success' || activeTestCase.status === 'passed') ? 'Passed' :
                                                        (activeTestCase.status === 'failure' || activeTestCase.status === 'failed') ? 'Failed' :
                                                            activeTestCase.status || 'Idle'}
                                                </div>
                                            </div>
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
    );
};
