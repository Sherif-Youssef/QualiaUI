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
    const [isRunningAll, setIsRunningAll] = useState(false);
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const { canManageCases, isLoading: permissionsLoading, error: permissionsError } = useProjectPermissions(projectId);

    const itemsPerPage = 5;

    useEffect(() => {
        const fetchTestCases = async () => {
            if (!suiteId || !projectId) return;
            setIsLoading(true);
            setError(null);
            try {
                const cases = await testCaseService.getTestCases(projectId, suiteId);
                setTestCases(cases);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load test cases.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTestCases();
    }, [suiteId, projectId]);

    const isPageLoading = isLoading || permissionsLoading;
    const pageError = error || permissionsError;

    const filteredCases = testCases.filter(testCase =>
        testCase.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
    const paginatedCases = filteredCases.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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
            setTestCases(testCases.filter(tc => tc.id !== deleteConfirmation.id));
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
        setIsRunningAll(true);
        setTestCases(testCases.map(tc => ({ ...tc, status: 'running', runVersion })));

        setTimeout(() => {
            setTestCases(prev => prev.map(tc => ({
                ...tc,
                status: Math.random() > 0.3 ? 'passed' : 'failed',
                runVersion,
            })));
            setIsRunningAll(false);
        }, 2000);
    };

    const handleSaveTestCase = async (data: any) => {
        if (!suiteId) return;

        setModalLoading(true);
        setModalError(null);
        try {
            if (editingTestCase) {
                const updatedCase = await testCaseService.updateTestCase(projectId!, suiteId!, editingTestCase.id, data);
                setTestCases(testCases.map(tc => tc.id === editingTestCase.id ? updatedCase : tc));
            } else {
                const newCase = await testCaseService.createTestCase(projectId!, suiteId!, data);
                setTestCases([...testCases, newCase]);
            }
            setIsModalOpen(false);
            setEditingTestCase(null);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to save test case.');
        } finally {
            setModalLoading(false);
        }
    };

    return (
        <TestSuiteLayout
            header={
                <TestSuiteHeader
                    runVersion={runVersion}
                    setRunVersion={setRunVersion}
                    isRunningAll={isRunningAll}
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
                    {pageError && <div className="mb-6"><ErrorMessage message={pageError} /></div>}

                    {isPageLoading && testCases.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 font-medium font-sans">Loading Test Cases...</p>
                        </div>
                    ) : (
                        <>
                            <TestCaseTable
                                testCases={paginatedCases}
                                onNavigate={(caseId) => navigate(`/project/${projectId}/suite/${suiteId}/case/${caseId}`)}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                                canManageCases={canManageCases}
                            />
                            {filteredCases.length === 0 && !isLoading && (
                                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                    <p className="text-gray-500 font-medium">No test cases match your search.</p>
                                </div>
                            )}
                        </>
                    )}
                </>
            }
            pagination={filteredCases.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredCases.length}
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
