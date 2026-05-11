import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TestSuite } from '@/types/test-suit';
import { testSuiteService } from '@/services/testSuit/testSuiteService';
import { projectService } from '@/services/project/projectService';
import { useProjectPermissions } from '@/hooks/useProjectPermissions';
import { ProjectView } from '../ProjectTabs';

interface UseProjectWorkspaceProps {
    projectId?: string;
}

export const useProjectWorkspace = ({ projectId }: UseProjectWorkspaceProps) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    
    // Initialize activeView from URL search params
    const activeView = (searchParams.get('tab') as ProjectView) || 'suites';
    const setActiveView = (view: ProjectView) => {
        setSearchParams({ tab: view }, { replace: true });
    };

    // Data State
    const [projectName, setProjectName] = useState<string>('');
    const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
    const [projectMembers, setProjectMembers] = useState<any[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
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

    useEffect(() => {
        const fetchProjectDetails = async () => {
            if (!projectId) return;
            try {
                const project = await projectService.getProjectById(projectId);
                setProjectName(project.name);
            } catch (err) {
                console.error('Failed to fetch project details:', err);
            }
        };
        fetchProjectDetails();
    }, [projectId]);

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
        projectName,
        searchQuery, setSearchQuery,
        currentPage, setCurrentPage,
        activeView, setActiveView,
        testSuites,
        projectMembers,
        totalItems,
        isLoading,
        error, setError,
        debouncedSearch,
        isModalOpen, setIsModalOpen,
        isAddMemberModalOpen, setIsAddMemberModalOpen,
        modalLoading,
        modalError, setModalError,
        canManageSuites,
        canManageProject,
        itemsPerPage,
        handleAddTestSuite,
        handleMemberAdd,
        handleMemberRemove,
    };
};
