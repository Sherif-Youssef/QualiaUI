import React, { useState, useEffect, useCallback, useRef } from 'react';
import { testCaseService } from '@/services/testCase/testCaseService';
import { runService } from '@/services/runService';
import { TestCase } from '@/types/test-case';
import { useProjectPermissions } from '@/hooks/useProjectPermissions';
import { useNavigate } from 'react-router-dom';
import { useRunStreaming } from '@/hooks/useRunStreaming';
import { parseUTCDate } from '@/utils/formatters';

interface UseTestSuiteProps {
    projectId?: string;
    suiteId?: string;
}

export const useTestSuite = ({ projectId, suiteId }: UseTestSuiteProps) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    const { canManageCases, isLoading: permissionsLoading, error: permissionsError } = useProjectPermissions(projectId);

    const [totalItems, setTotalItems] = useState(0);
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
    const [isRunningSuite, setIsRunningSuite] = useState(false);
    const [activeRunId, setActiveRunId] = useState<number | null>(null);
    const isStartingRef = useRef(false);

    const itemsPerPage = 6;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchData = useCallback(async () => {
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
            setTotalItems(result.total);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load test cases.');
        } finally {
            setIsLoading(false);
        }
    }, [suiteId, projectId, currentPage, debouncedSearch, itemsPerPage]);

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
        if (!deleteConfirmation || !projectId || !suiteId) return;

        setModalLoading(true);
        setModalError(null);
        try {
            await testCaseService.deleteTestCase(projectId, suiteId, deleteConfirmation.id);
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

    const handleRunAll = async (llmModelId?: number) => {
        if (!projectId || !suiteId || isStartingRef.current) return;

        isStartingRef.current = true;
        setIsRunningSuite(true);
        setError(null);
        try {
            const run = await runService.startTestSuiteRun(parseInt(suiteId), 'NATURAL', llmModelId);
            setActiveRunId(run.run_id);
            navigate(`/project/${projectId}/suite/${suiteId}/run/${run.run_id}`);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to start test run.');
            setIsRunningSuite(false);
            isStartingRef.current = false;
        }
    };

    const [isAborting, setIsAborting] = useState(false);

    const handleAbortSuite = async () => {
        if (!activeRunId) return;
        setIsAborting(true);
        try {
            await runService.abortTestSuiteRun(activeRunId);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to abort test run.');
            setIsAborting(false);
        }
    };

    const handleStatusChange = useCallback((event: any) => {
        if (!event || event.element !== 'TESTCASE') {
            if (event?.element === 'TESTSUITE' && ['PASSED', 'FAILED', 'ABORTED', 'ERROR'].includes(event.status)) {
                setIsRunningSuite(false);
                setIsAborting(false);
                setActiveRunId(null);
                fetchData();
            }
            return;
        }

        setTestCases(prev => prev.map(tc => {
            if (tc.id !== String(event.id)) return tc;

            let duration = tc.lastRunDuration;
            if (event.started_at && event.finished_at) {
                try {
                    const start = parseUTCDate(event.started_at)?.getTime() || 0;
                    const end = parseUTCDate(event.finished_at)?.getTime() || 0;
                    if (start > 0 && end > 0) {
                        const diff = Math.floor((end - start) / 1000);
                        duration = diff < 60 ? `${diff}s` : `${Math.floor(diff / 60)}m ${diff % 60}s`;
                    }
                } catch (e) {
                    console.error("Error calculating duration:", e);
                }
            }

            return {
                ...tc,
                status: (event.status?.toLowerCase() || tc.status) as any,
                lastRunDuration: duration
            };
        }));
    }, [fetchData]);

    useRunStreaming({
        scope: 'TESTSUITE',
        runId: activeRunId ? String(activeRunId) : '',
        onStatusChange: handleStatusChange
    });

    const handleSaveTestCase = async (data: any) => {
        if (!suiteId || !projectId) return;

        setModalLoading(true);
        setModalError(null);
        try {
            if (editingTestCase) {
                await testCaseService.updateTestCase(projectId, suiteId, editingTestCase.id, data);
            } else {
                await testCaseService.createTestCase(projectId, suiteId, data);
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

    return {
        searchQuery, setSearchQuery,
        currentPage, setCurrentPage,
        isModalOpen, setIsModalOpen,
        editingTestCase, setEditingTestCase,
        deleteConfirmation, setDeleteConfirmation,
        testCases,
        isLoading,
        error, setError,
        modalLoading,
        modalError, setModalError,
        canManageCases,
        totalItems,
        debouncedSearch,
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
    };
};
