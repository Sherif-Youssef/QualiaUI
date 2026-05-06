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

export const TestSuitePage: React.FC = () => {
    const { projectId, suiteId } = useParams<{ projectId: string; suiteId: string }>();
    const navigate = useNavigate();
    const [selectedModel, setSelectedModel] = React.useState('gemini-1.5-pro');

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
                    onRunAll={() => handleRunAll(selectedModel)}
                    onAbort={handleAbortSuite}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
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
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search Test Case..."
                    />
                </div>
            )}
            content={
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
