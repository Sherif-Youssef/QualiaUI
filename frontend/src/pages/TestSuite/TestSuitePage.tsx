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
import { runService } from '@/services/runService';
import { TestSuiteRun } from '@/types/run';
import { RunHistoryTable } from '@/components/RunHistory/RunHistoryTable';
import { Clock, LayoutGrid } from 'lucide-react';

export const TestSuitePage: React.FC = () => {
    const navigate = useNavigate();
    const { projectId, suiteId } = useParams<{ projectId: string; suiteId: string }>();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [history, setHistory] = useState<TestSuiteRun[]>([]);
    const [activeView, setActiveView] = useState<'cases' | 'history'>('cases');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const { canManageCases, isLoading: permissionsLoading, error: permissionsError } = useProjectPermissions(projectId);

    const [totalItems, setTotalItems] = useState(0);
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

    const itemsPerPage = 6;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchData = React.useCallback(async () => {
        if (!suiteId || !projectId) return;
        setIsLoading(true);
        setError(null);
        try {
            const offset = (currentPage - 1) * itemsPerPage;
            
            if (activeView === 'cases') {
                const result = await testCaseService.getTestCases(projectId, suiteId, offset, itemsPerPage, debouncedSearch);

                if (result.testCases.length === 0 && currentPage > 1 && result.total > 0) {
                    setCurrentPage(prev => {
                        const next = prev - 1;
                        return next > 0 ? next : 1;
                    });
                    return;
                }

                setTestCases(result.testCases);
                setTotalItems(result.total);
            } else {
                const historyResult = await runService.getTestSuiteRuns(projectId, suiteId, offset, itemsPerPage);
                
                if (historyResult.runs.length === 0 && currentPage > 1 && historyResult.total > 0) {
                    setCurrentPage(prev => prev - 1);
                    return;
                }

                setHistory(historyResult.runs);
                setTotalItems(historyResult.total);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || `Failed to load ${activeView === 'cases' ? 'test cases' : 'history'}.`);
        } finally {
            setIsLoading(false);
        }
    }, [suiteId, projectId, currentPage, debouncedSearch, activeView]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

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
            await fetchData();
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

    const handleRunAll = async () => {
        if (!projectId || !suiteId) return;
        
        setIsLoading(true);
        setError(null);
        try {
            const run = await runService.startTestSuiteRun(parseInt(suiteId), 'NATURAL');
            navigate(`/project/${projectId}/suite/${suiteId}/manager`, {
                state: { runId: run.run_id, scope: 'TESTSUITE' }
            });
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to start test run.');
            setIsLoading(false);
        }
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
            await fetchData();
            setIsModalOpen(false);
            setEditingTestCase(null);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to save test case.');
        } finally {
            setModalLoading(false);
        }
    };

    const isTrulyEmpty = totalItems === 0 && debouncedSearch === '' && !isLoading;
    const isSearchEmpty = testCases.length === 0 && debouncedSearch !== '' && !isLoading;

    return (
        <TestSuiteLayout
            error={pageError && <ErrorMessage message={pageError} />}
            header={
                <TestSuiteHeader
                    isRunningAll={isLoading && activeView === 'history'}
                    onRunAll={handleRunAll}
                    onAddTestCase={() => {
                        setEditingTestCase(null);
                        setModalError(null);
                        setIsModalOpen(true);
                    }}
                    canManageCases={canManageCases}
                    onBack={() => navigate(`/project/${projectId}`)}
                />
            }
            searchBar={(
                <div className="space-y-4">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => { setActiveView('cases'); setCurrentPage(1); }}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative ${
                                activeView === 'cases' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            Test Cases
                            {activeView === 'cases' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                        </button>
                        <button
                            onClick={() => { setActiveView('history'); setCurrentPage(1); }}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative ${
                                activeView === 'history' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
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
