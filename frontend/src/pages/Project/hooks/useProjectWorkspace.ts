import { useState, useEffect, useCallback } from 'react';
import { TestSuite } from '@/types/test-suit';
import { testSuiteService } from '@/services/testSuit/testSuiteService';
import { projectService } from '@/services/project/projectService';
import { runService } from '@/services/runService';
import { ProjectRun } from '@/types/run';
import { useProjectPermissions } from '@/hooks/useProjectPermissions';
import { ProjectView } from '../ProjectTabs';

interface UseProjectWorkspaceProps {
    projectId?: string;
}

export const useProjectWorkspace = ({ projectId }: UseProjectWorkspaceProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [activeView, setActiveView] = useState<ProjectView>('suites');

    // Data State
    const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
    const [projectMembers, setProjectMembers] = useState<any[]>([]);
    const [history, setHistory] = useState<ProjectRun[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [editingSuite, setEditingSuite] = useState<TestSuite | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    const { canManageSuites, canManageProject } = useProjectPermissions(projectId);
    const itemsPerPage = 6;

    // Search Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchData = useCallback(async () => {
        if (!projectId) return;

        setIsLoading(true);
        setError(null);
        try {
            const offset = (currentPage - 1) * itemsPerPage;

            if (activeView === 'suites') {
                const res = await testSuiteService.getTestSuites(projectId, offset, itemsPerPage, debouncedSearch);
                setTestSuites(res.testSuites);
                setTotalItems(res.total);
            } else if (activeView === 'team') {
                const project = await projectService.getProjectById(projectId);
                const filtered = (project.members || []).filter(m =>
                    `${m.user.firstName} ${m.user.lastName}`.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                    m.user.email.toLowerCase().includes(debouncedSearch.toLowerCase())
                );
                setProjectMembers(filtered);
                setTotalItems(filtered.length);
            } else {
                const res = await runService.getProjectRuns(projectId, offset, itemsPerPage);
                setHistory(res.runs);
                setTotalItems(res.total);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || `Failed to load ${activeView}.`);
        } finally {
            setIsLoading(false);
        }
    }, [projectId, currentPage, debouncedSearch, activeView, itemsPerPage]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handlers
    const handleAddTestSuite = async (data: any) => {
        if (!projectId) return;
        setModalLoading(true);
        try {
            await testSuiteService.createTestSuite(projectId, data);
            setIsModalOpen(false);
            fetchData();
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to create suite.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleEditTestSuite = async (id: string, data: any) => {
        if (!projectId) return;
        setModalLoading(true);
        try {
            await testSuiteService.updateTestSuite(projectId, id, data);
            setIsModalOpen(false);
            setEditingSuite(null);
            fetchData();
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to update suite.');
        } finally {
            setModalLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation || !projectId) return;
        setModalLoading(true);
        try {
            await testSuiteService.deleteTestSuite(projectId, deleteConfirmation.id);
            setDeleteConfirmation(null);
            fetchData();
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to delete suite.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleMemberAdd = async (userId: any, role: string) => {
        if (!projectId) return;
        setModalLoading(true);
        try {
            await projectService.addMember(projectId, userId, role);
            setIsAddMemberModalOpen(false);
            setSearchQuery('');
            fetchData();
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to add member.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleMemberRemove = async (email: string) => {
        if (!projectId) return;
        try {
            await projectService.removeMember(projectId, email);
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to remove member.');
        }
    };



    return {
        searchQuery, setSearchQuery,
        currentPage, setCurrentPage,
        activeView, setActiveView,
        testSuites,
        projectMembers,
        history,
        totalItems,
        isLoading,
        error, setError,
        debouncedSearch,
        isModalOpen, setIsModalOpen,
        isAddMemberModalOpen, setIsAddMemberModalOpen,
        editingSuite, setEditingSuite,
        deleteConfirmation, setDeleteConfirmation,
        modalLoading,
        modalError, setModalError,
        canManageSuites,
        canManageProject,
        itemsPerPage,
        handleAddTestSuite,
        handleEditTestSuite,
        confirmDelete,
        handleMemberAdd,
        handleMemberRemove,
    };
};
