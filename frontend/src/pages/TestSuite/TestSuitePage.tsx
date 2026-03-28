import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';
import { AddTestCaseModal } from '@/components/Modal/AddTestCaseModal';
import { DeleteConfirmationModal } from '@/components/Modal/DeleteConfirmationModal';
import { TestCase } from '@/types/test-case';
import { testCaseService } from '@/services/testCase/testCaseService';
import { useProjectPermissions } from '@/hooks/useProjectPermissions';
import { ErrorMessage } from '@/components/GeneralComponents';
import { TestSuiteLayout } from './TestSuiteLayout';
import { TestSuiteHeader } from './TestSuiteHeader';
import { TestCaseTable } from './TestCaseTable';

export const TestSuitePage: React.FC = () => {
    const navigate = useNavigate();
    const { projectId, suiteId } = useParams<{ projectId: string; suiteId: string }>();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);
    const [runVersion, setRunVersion] = useState('v1.0');
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const { canManageCases, isLoading: permissionsLoading, error: permissionsError } = useProjectPermissions(projectId);

    const [totalCases, setTotalCases] = useState(0);
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

    const itemsPerPage = 6;


    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchTestCases = React.useCallback(async () => {
        if (!suiteId || !projectId) return;
        setIsLoading(true);
        setError(null);
        try {
            const offset = (currentPage - 1) * itemsPerPage;
            const result = await testCaseService.getTestCases(projectId, suiteId, offset, itemsPerPage, debouncedSearch);

            if (result.testCases.length === 0 && currentPage > 1 && result.total > 0) {
                setCurrentPage(prev => {
                    const next = prev - 1;
                    return next > 0 ? next : 1;
                });
                return;
            }

            setTestCases(result.testCases);
            setTotalCases(result.total);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load test cases.');
        } finally {
            setIsLoading(false);
        }
    }, [suiteId, projectId, currentPage, debouncedSearch]);

    useEffect(() => {
        fetchTestCases();
    }, [fetchTestCases]);

    const totalPages = Math.ceil(totalCases / itemsPerPage);


    const isPageLoading = isLoading || permissionsLoading;
    const pageError = error || permissionsError;

    const handleDeleteClick = (id: string, name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setModalError(null);
        setDeleteConfirmation({ id, name });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation) return;

        setModalLoading(true);
        setModalError(null);
        try {
            await testCaseService.deleteTestCase(projectId!, suiteId!, deleteConfirmation.id);
            await fetchTestCases();
            setDeleteConfirmation(null);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to delete test case.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleEditClick = (testCase: TestCase, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingTestCase(testCase);
        setModalError(null);
        setIsModalOpen(true);
    };
    const handleRunAll = () => {
        if (!projectId || !suiteId) return;
        navigate(`/project/${projectId}/suite/${suiteId}/manager`);
    };

    const handleSaveTestCase = async (data: any) => {
        if (!suiteId) return;

        setModalLoading(true);
        setModalError(null);
        try {
            if (editingTestCase) {
                await testCaseService.updateTestCase(projectId!, suiteId!, editingTestCase.id, data);
            } else {
                await testCaseService.createTestCase(projectId!, suiteId!, data);
                setCurrentPage(1);
            }
            await fetchTestCases();
            setIsModalOpen(false);
            setEditingTestCase(null);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to save test case.');
        } finally {
            setModalLoading(false);
        }
    };

    const isTrulyEmpty = totalCases === 0 && debouncedSearch === '' && !isLoading;
    const isSearchEmpty = testCases.length === 0 && debouncedSearch !== '' && !isLoading;

    return (
        <TestSuiteLayout
            error={pageError && <ErrorMessage message={pageError} />}
            header={
                <TestSuiteHeader
                    runVersion={runVersion}
                    setRunVersion={setRunVersion}
                    isRunningAll={false}
                    onRunAll={handleRunAll}
                    onAddTestCase={() => {
                        setEditingTestCase(null);
                        setModalError(null);
                        setIsModalOpen(true);
                    }}
                    canManageCases={canManageCases}
                />
            }
            searchBar={
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search Test Case..."
                />
            }
            content={
                <>
                    {isPageLoading && testCases.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 font-medium font-sans">Loading Test Cases...</p>
                        </div>
                    ) : isTrulyEmpty ? (
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
                    )}
                </>
            }
            pagination={totalCases > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalCases}
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
