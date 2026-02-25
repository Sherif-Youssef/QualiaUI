import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';
import { AddProjectModal } from '@/components/Modal/AddProjectModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmation';
import { Project } from '@/types';
import { projectService } from '@/services/project/projectService.ts';
import { ErrorMessage } from '@/components/GeneralComponents';

import { ProjectsLayout, ProjectsHeader, ProjectsEmptyState, ProjectsTable } from "./index.ts";

export const ProjectsPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);

    // Page Status
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal Status
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    const itemsPerPage = 6;

    useEffect(() => {
        const fetchProjects = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await projectService.getAllProjects();
                setProjects(data);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to fetch projects.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
    const paginatedProjects = filteredProjects.slice(
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
            await projectService.deleteProject(deleteConfirmation.id);
            setProjects(projects.filter(p => p.id !== deleteConfirmation.id));
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
            const updatedProject = await projectService.updateProject(id, data);
            setProjects(projects.map(p => p.id === id ? updatedProject : p));
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
            const newProject = await projectService.createProject(data);
            setProjects([...projects, newProject]);
            setIsModalOpen(false);
            setEditingProject(null);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to create project.');
        } finally {
            setModalLoading(false);
        }
    };

    const isEmpty = projects.length === 0 && !isLoading;

    return (
        <ProjectsLayout
            header={!isEmpty && <ProjectsHeader onAddProject={() => {
                setModalError(null);
                setIsModalOpen(true);
            }} />}
            searchBar={!isEmpty && (
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search Projects..."
                />
            )}
            content={
                <>
                    {error && <div className="mb-6"><ErrorMessage message={error} /></div>}

                    {isLoading && projects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 font-bold text-lg">Waking up your workspace...</p>
                        </div>
                    ) : isEmpty ? (
                        <ProjectsEmptyState onCreateNew={() => {
                            setModalError(null);
                            setIsModalOpen(true);
                        }} />
                    ) : (
                        <>
                            <ProjectsTable
                                projects={paginatedProjects}
                                onNavigate={(id) => navigate(`/project/${id}`)}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                            />
                            {filteredProjects.length === 0 && !isLoading && (
                                <div className="text-center py-12 text-gray-500 font-medium bg-white rounded-[2rem] border border-dashed border-gray-200">
                                    No projects match your search.
                                </div>
                            )}
                        </>
                    )}
                </>
            }
            pagination={!isEmpty && filteredProjects.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredProjects.length}
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
                        isLoading={modalLoading}
                    />
                </>
            }
        />
    );
};
