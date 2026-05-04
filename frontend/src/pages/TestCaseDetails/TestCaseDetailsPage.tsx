import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ErrorMessage } from '@/components/GeneralComponents';
import { Pagination } from '@/components/Pagination';
import { AddTestCaseModal } from '@/components/Modal/AddTestCaseModal';

import { TestRunHistoryTable } from './components/TestRunHistoryTable';
import { TestCaseDetailsLayout } from './TestCaseDetailsLayout';
import { ScreenshotViewer } from './ScreenshotViewer';
import { useTestCaseDetails } from './hooks/useTestCaseDetails';
import { TestCaseHeader } from './components/TestCaseHeader';
import { TestCaseTabs } from './components/TestCaseTabs';
import { ExecutionStepsSidebar } from './components/ExecutionStepsSidebar';

export const TestCaseDetailsPage: React.FC = () => {
    const { projectId, suiteId, caseId } = useParams<{ projectId: string; suiteId: string; caseId: string }>();
    const navigate = useNavigate();

    const {
        testCase,
        history,
        activeView,
        setActiveView,
        isLoading,
        error,
        selectedStepId,
        setSelectedStepId,
        isRunning,
        activeSteps,
        currentScreenshot,
        isAborting,
        page,
        setPage,
        limit,
        totalRuns,
        runTestCase,
        abortTestCase,
        updateTestCase,
        terminationReason,
        finalStatus
    } = useTestCaseDetails({ projectId, suiteId, caseId });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState('gemini-1.5-pro');
    const [isSaving, setIsSaving] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

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
                            onRun={() => runTestCase(selectedModel)}
                            onAbort={abortTestCase}
                        />
                        <TestCaseTabs
                            activeView={activeView}
                            setActiveView={setActiveView}
                        />
                    </div>
                </div>
                <div className="flex-1 flex overflow-hidden min-h-0">
                    {activeView === 'steps' ? (
                        <>
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
                            />
                            <main className="flex-1 flex flex-col overflow-hidden bg-gray-50/30 min-h-0">
                                <ScreenshotViewer
                                    screenshot={displaySteps.find(s => String(s.id) === selectedStepId)?.screenshot || currentScreenshot || null}
                                    number={displaySteps.findIndex(s => String(s.id) === selectedStepId) + 1}
                                />
                            </main>
                        </>
                    ) : (
                        <main className="flex-1 overflow-auto p-8 bg-gray-50/30 min-h-0">
                            <div className="max-w-6xl mx-auto space-y-6">
                                <TestRunHistoryTable
                                    history={history}
                                    projectId={projectId || ''}
                                    onRunClick={(run) => {
                                        const sId = run.testsuite_run_id || 'standalone';
                                        const rId = (run as any).project_run_id || 'standalone';
                                        navigate(`/project/${projectId}/history/${rId}/suite/${sId}/case/${run.id}`);
                                    }}
                                />
                                {totalRuns > limit && (
                                    <Pagination
                                        currentPage={page}
                                        totalPages={Math.ceil(totalRuns / limit)}
                                        itemsPerPage={limit}
                                        totalItems={totalRuns}
                                        onPageChange={setPage}
                                    />
                                )}
                            </div>
                        </main>
                    )}
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
        </TestCaseDetailsLayout>
    );
};
