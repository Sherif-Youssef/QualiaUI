import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TestSuiteLayout } from './TestSuiteLayout';
import { TestSuiteHeader } from './TestSuiteHeader';
import { TestCaseTable } from './TestCaseTable';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';
import { AddTestCaseModal } from '@/components/Modal/AddTestCaseModal';
import { DeleteConfirmationModal } from '@/components/Modal/DeleteConfirmationModal';
import { ErrorMessage } from '@/components/GeneralComponents';
import { useTestSuite } from './hooks/useTestSuite';
import { RunConfigurationModal } from '@/components/Modal/RunConfigurationModal';
import { TestSuiteHistoryView } from './TestSuiteHistoryView';
import { LayoutGrid, History } from 'lucide-react';

export const TestSuitePage: React.FC = () => {
    const { projectId, suiteId } = useParams<{ projectId: string; suiteId: string }>();
    const navigate = useNavigate();
    const [isRunConfigModalOpen, setIsRunConfigModalOpen] = React.useState(false);
    const [activeView, setActiveView] = React.useState<'cases' | 'history'>('cases');

    const {
        searchQuery, setSearchQuery,
        currentPage, setCurrentPage,
        isModalOpen, setIsModalOpen,
        editingTestCase, setEditingTestCase,
        deleteConfirmation, setDeleteConfirmation,
        testCases,
        setError,
        modalLoading,
        modalError, setModalError,
        canManageCases,
        totalItems,
        itemsPerPage,
        totalPages,
        isPageLoading,
        pageError,
        isTrulyEmpty,
        isSearchEmpty,
        handleDeleteClick,
        confirmDelete,
        handleEditClick,
        handleRunAll,
        handleAbortSuite,
        isRunningSuite,
        isAborting,
        handleSaveTestCase
    } = useTestSuite({ projectId, suiteId });

    return (
        <TestSuiteLayout
            error={pageError && <ErrorMessage message={pageError} onClose={() => setError(null)} />}
            header={
                <TestSuiteHeader
                    suiteName={testCases[0]?.suiteName}
                    isRunningAll={isRunningSuite}
                    isAborting={isAborting}
                    onRunAll={() => setIsRunConfigModalOpen(true)}
                    onAbort={handleAbortSuite}
                    onAddTestCase={() => {
                        setEditingTestCase(null);
                        setModalError(null);
                        setIsModalOpen(true);
                    }}
                    onBack={() => navigate(`/project/${projectId}`)}
                />
            }
            searchBar={(
                <div className="space-y-4">
                    <div className="flex border-b border-gray-200 mb-6">
                        <button
                            onClick={() => setActiveView('cases')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${activeView === 'cases' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            Test Cases
                            {activeView === 'cases' && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(var(--primary-rgb),0.3)]" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveView('history')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${activeView === 'history' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <History className="w-4 h-4" />
                            Execution History
                            {activeView === 'history' && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(var(--primary-rgb),0.3)]" />
                            )}
                        </button>
                    </div>

                    {activeView === 'cases' && (
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search Test Case..."
                        />
                    )}
                </div>
            )}
            content={
                activeView === 'cases' ? (
                    <>
                        {isPageLoading && testCases.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                                <p className="text-gray-500 font-medium font-sans">Loading test cases...</p>
                            </div>
                        ) : (
                            isTrulyEmpty ? (
                                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                    <p className="text-gray-500 font-medium text-lg mb-2">Workspace is currently empty</p>
                                    <p className="text-gray-400">Add your first test case to get started.</p>
                                </div>
                            ) : (
                                <>
                                    <TestCaseTable
                                        testCases={testCases}
                                        onNavigate={(caseId) => navigate(`/project/${projectId}/suite/${suiteId}/case/${caseId}?view=live`)}
                                        onHistory={(caseId) => navigate(`/project/${projectId}/suite/${suiteId}/case/${caseId}?view=history`)}
                                        onEdit={handleEditClick}
                                        onDelete={handleDeleteClick}
                                        canManageCases={canManageCases}
                                    />
                                    {isSearchEmpty && (
                                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                            <p className="text-gray-500 font-medium">No test cases match your search.</p>
                                        </div>
                                    )}
                                </>
                            )
                        )}
                    </>
                ) : (
                    projectId && suiteId && (
                        <TestSuiteHistoryView
                            projectId={projectId}
                            suiteId={suiteId}
                        />
                    )
                )
            }
            pagination={activeView === 'cases' && totalItems > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalItems}
                    onPageChange={setCurrentPage}
                />
            )}
            modals={
                <>
                    <AddTestCaseModal
                        isOpen={isModalOpen}
                        onClose={() => {
                            setIsModalOpen(false);
                            setEditingTestCase(null);
                            setModalError(null);
                        }}
                        editingTestCase={editingTestCase}
                        onSave={handleSaveTestCase}
                        isLoading={modalLoading}
                        error={modalError}
                    />

                    <DeleteConfirmationModal
                        isOpen={deleteConfirmation !== null}
                        onClose={() => {
                            setDeleteConfirmation(null);
                            setModalError(null);
                        }}
                        onConfirm={confirmDelete}
                        itemName={deleteConfirmation?.name || ""}
                        isLoading={modalLoading}
                        error={modalError}
                    />

                    <RunConfigurationModal
                        isOpen={isRunConfigModalOpen}
                        onClose={() => setIsRunConfigModalOpen(false)}
                        onConfirm={(llmModelId) => {
                            handleRunAll(llmModelId);
                            setIsRunConfigModalOpen(false);
                        }}
                        title={`Run Suite: ${testCases[0]?.suiteName || 'Test Suite'}`}
                    />
                </>
            }
        />
    );
};
