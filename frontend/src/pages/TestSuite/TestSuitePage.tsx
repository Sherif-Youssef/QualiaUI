import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';
import { AddTestCaseModal } from '@/components/Modal/AddTestCaseModal';
import { DeleteConfirmationModal } from '@/components/Modal/DeleteConfirmationModal';
import { ErrorMessage } from '@/components/GeneralComponents';
import { TestSuiteLayout } from './TestSuiteLayout';
import { TestSuiteHeader } from './TestSuiteHeader';
import { TestCaseTable } from './TestCaseTable';
import { RunHistoryTable } from '@/components/RunHistory/RunHistoryTable';
import { Clock, LayoutGrid } from 'lucide-react';
import { useTestSuite } from './hooks/useTestSuite';

export const TestSuitePage: React.FC = () => {
    const navigate = useNavigate();
    const { projectId, suiteId } = useParams<{ projectId: string; suiteId: string }>();

    const {
        searchQuery, setSearchQuery,
        currentPage, setCurrentPage,
        isModalOpen, setIsModalOpen,
        editingTestCase, setEditingTestCase,
        deleteConfirmation, setDeleteConfirmation,
        testCases,
        history,
        activeView, setActiveView,
        isLoading,
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
        handleSaveTestCase
    } = useTestSuite({ projectId, suiteId });

    return (
        <TestSuiteLayout
            error={pageError && <ErrorMessage message={pageError} onClose={() => setError(null)} />}
            header={
                <TestSuiteHeader
                    isRunningAll={isLoading && activeView === 'history'}
                    onRunAll={handleRunAll}
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
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => { setActiveView('cases'); setCurrentPage(1); }}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative ${activeView === 'cases' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            Test Cases
                            {activeView === 'cases' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                        </button>
                        <button
                            onClick={() => { setActiveView('history'); setCurrentPage(1); }}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative ${activeView === 'history' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Clock className="w-4 h-4" />
                            Runs History
                            {activeView === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
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
                <>
                    {isPageLoading && (activeView === 'cases' ? testCases.length === 0 : history.length === 0) ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 font-medium font-sans">Loading {activeView === 'cases' ? 'test cases' : 'history'}...</p>
                        </div>
                    ) : activeView === 'cases' ? (
                        isTrulyEmpty ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                <p className="text-gray-500 font-medium text-lg mb-2">Workspace is currently empty</p>
                                <p className="text-gray-400">Add your first test case to get started.</p>
                            </div>
                        ) : (
                            <>
                                <TestCaseTable
                                    testCases={testCases}
                                    onNavigate={(caseId) => navigate(`/project/${projectId}/suite/${suiteId}/case/${caseId}`)}
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
                    ) : (
                        <RunHistoryTable
                            runs={history}
                            isLoading={isLoading}
                            onViewDetails={(run) => {
                                const rId = run.project_run_id || 'standalone';
                                navigate(`/project/${projectId}/history/${rId}/suite/${run.id}`);
                            }}
                        />
                    )}
                </>
            }
            pagination={totalItems > 0 && (
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
                </>
            }
        />
    );
};
