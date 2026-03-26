import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';
import { AddProjectModal } from '@/components/Modal/AddProjectModal';
import { DeleteConfirmationModal } from '@/components/Modal/DeleteConfirmationModal';
import { Project } from '@/types/project';
import { projectService } from '@/services/project/projectService.ts';
import { authService } from '@/services/auth/auth';
import { ErrorMessage } from '@/components/GeneralComponents';

import { ProjectsLayout } from "./ProjectsLayout";
import { ProjectsHeader } from "./ProjectsHeader";
import { ProjectsEmptyState } from "./ProjectsEmptyState";
import { ProjectsTable } from "./ProjectsTable";

export const ProjectsPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    const fetchProjects = React.useCallback(async () => {
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
    }, [currentPage, debouncedSearch]);

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

    return (
        <ProjectsLayout
            header={(
                <ProjectsHeader
                    onAddProject={() => {
                        setModalError(null);
                        setIsModalOpen(true);
                    }}
                    isAdmin={isAdminState}
                />
            )}
            searchBar={(
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search Projects..."
                />
            )}
            content={
                <>
                    {error && <div className="mb-6"><ErrorMessage message={error} onClose={() => setError(null)} /></div>}

                    {isLoading && projects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 font-bold text-lg">Waking up your workspace...</p>
                        </div>
                    ) : isTrulyEmpty ? (
                        <ProjectsEmptyState isAdmin={isAdminState} onCreateNew={() => {
                            setModalError(null);
                            setIsModalOpen(true);
                        }} />
                    ) : (
                        <>
                            <ProjectsTable
                                projects={projects}
                                onNavigate={(id) => navigate(`/project/${id}`)}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                                isAdmin={isAdminState}
                                userRole={userRoleState}
                            />
                             {isSearchEmpty && (
                                <div className="text-center py-12 text-gray-500 font-medium bg-white rounded-[2rem] border border-dashed border-gray-200">
                                    No projects match your search.
                                </div>
                            )}
                        </>
                    )}
                </>
            }
            pagination={totalProjects > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalProjects}
                    onPageChange={setCurrentPage}
                />
            )}
            modals={
                <>
                    <AddProjectModal
                        isOpen={isModalOpen}
                        onClose={() => {
                            setIsModalOpen(false);
                            setEditingProject(null);
                            setModalError(null);
                        }}
                        onAdd={handleAddProject}
                        editingProject={editingProject}
                        onEdit={handleEditProject}
                        error={modalError}
                        onClearError={() => setModalError(null)}
                        isLoading={modalLoading}
                    />

                    <DeleteConfirmationModal
                        isOpen={deleteConfirmation !== null}
                        onClose={() => {
                            setDeleteConfirmation(null);
                            setModalError(null);
                        }}
                        onConfirm={confirmDelete}
                        itemName={deleteConfirmation?.name}
                        error={modalError}
                        onClearError={() => setModalError(null)}
                        isLoading={modalLoading}
                    />
                </>
            }
        />
    );
};
