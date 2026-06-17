import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from "@/types";
import { projectService } from '@/services/project/projectService';
import { authService } from '@/services/auth/auth';

export const useProjects = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingProject, setViewingProject] = useState<Project | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isAdminState, setIsAdminState] = useState(false);
    const [userRoleState, setUserRoleState] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    const [totalProjects, setTotalProjects] = useState(0);
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

    const itemsPerPage = 6;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchProjects = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const user = await authService.getCurrentUser();
            setIsAdminState(user.is_admin || user.role?.toLowerCase() === 'admin');
            setUserRoleState(user.role?.toLowerCase());

            const offset = (currentPage - 1) * itemsPerPage;
            const result = await projectService.getAllProjects(offset, itemsPerPage, debouncedSearch);

            if (result.projects.length === 0 && currentPage > 1 && result.total > 0) {
                setCurrentPage(prev => {
                    const next = prev - 1;
                    return next > 0 ? next : 1;
                });
                return;
            }

            setProjects(result.projects);
            setTotalProjects(result.total);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to initialize workspace data.');
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, debouncedSearch, itemsPerPage]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const totalPages = Math.ceil(totalProjects / itemsPerPage);

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
            await projectService.deleteProject(deleteConfirmation.id);
            await fetchProjects();
            setDeleteConfirmation(null);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to delete project.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleViewDetailsClick = (project: Project, e: React.MouseEvent) => {
        e.stopPropagation();
        setViewingProject(project);
        setIsViewModalOpen(true);
    };

    const handleEditClick = (project: Project, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingProject(project);
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleEditProject = async (id: string, data: { name: string; description: string }) => {
        setModalLoading(true);
        setModalError(null);
        try {
            await projectService.updateProject(id, data);
            await fetchProjects();
            setIsModalOpen(false);
            setEditingProject(null);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to update project.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleAddProject = async (data: { name: string; description: string }) => {
        setModalLoading(true);
        setModalError(null);
        try {
            const user = await authService.getCurrentUser();
            const isAdmin = user.is_admin || user.role === 'admin' || user.role === 'Administrator';

            const projectData = {
                ...data,
                members: isAdmin ? [] : [
                    { user_id: user.id, role: 'admin' }
                ]
            };
            await projectService.createProject(projectData as any);
            setCurrentPage(1);
            await fetchProjects();
            setIsModalOpen(false);
            setEditingProject(null);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to create project.');
        } finally {
            setModalLoading(false);
        }
    };

    const isTrulyEmpty = totalProjects === 0 && debouncedSearch === '' && !isLoading;
    const isSearchEmpty = projects.length === 0 && debouncedSearch !== '' && !isLoading;

    return {
        searchQuery, setSearchQuery,
        currentPage, setCurrentPage,
        isModalOpen, setIsModalOpen,
        viewingProject, setViewingProject,
        isViewModalOpen, setIsViewModalOpen,
        editingProject, setEditingProject,
        deleteConfirmation, setDeleteConfirmation,
        projects,
        isAdminState,
        userRoleState,
        isLoading,
        error, setError,
        modalLoading,
        modalError, setModalError,
        totalProjects,
        debouncedSearch,
        itemsPerPage,
        totalPages,
        isTrulyEmpty,
        isSearchEmpty,
        handleDeleteClick,
        confirmDelete,
        handleViewDetailsClick,
        handleEditClick,
        handleEditProject,
        handleAddProject,
        navigate
    };
};
