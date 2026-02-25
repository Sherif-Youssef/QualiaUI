import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';
import { AddProjectModal } from '@/components/Modal/AddProjectModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmation';
import { Project } from '@/types';

// Sub-components
import { ProjectsLayout } from './ProjectsLayout';
import { ProjectsHeader } from './ProjectsHeader';
import { ProjectsTable } from './ProjectsTable';
import { ProjectsEmptyState } from './ProjectsEmptyState';

export const ProjectsPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);
    const itemsPerPage = 6;

    const [projects, setProjects] = useState<Project[]>([
        { id: 'proj-1', name: 'E-commerce Platform', description: 'Main shopping application tests', createdAt: '2024-01-10' },
        { id: 'proj-2', name: 'Admin Dashboard', description: 'Backend management system', createdAt: '2024-01-12' },
        { id: 'proj-3', name: 'Mobile App', description: 'iOS and Android app testing', createdAt: '2024-01-15' },
    ]);

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
        setDeleteConfirmation({ id, name });
    };

    const confirmDelete = () => {
        if (deleteConfirmation) {
            setProjects(projects.filter(p => p.id !== deleteConfirmation.id));
            setDeleteConfirmation(null);
        }
    };

    const handleEditClick = (project: Project, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingProject(project);
        setIsModalOpen(true);
    };

    const handleEditProject = (id: string, data: { name: string; description: string }) => {
        setProjects(projects.map(p =>
            p.id === id ? { ...p, name: data.name, description: data.description } : p
        ));
        setIsModalOpen(false);
        setEditingProject(null);
    };

    const handleAddProject = (data: { name: string; description: string }) => {
        const newProject: Project = {
            id: `proj-${Date.now()}`,
            name: data.name,
            description: data.description,
            createdAt: new Date().toISOString().split('T')[0],
        };
        setProjects([...projects, newProject]);
        setIsModalOpen(false);
        setEditingProject(null);
    };

    const isEmpty = projects.length === 0;

    return (
        <ProjectsLayout
            header={!isEmpty && <ProjectsHeader onAddProject={() => setIsModalOpen(true)} />}
            searchBar={!isEmpty && (
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search Projects..."
                />
            )}
            content={
                isEmpty ? (
                    <ProjectsEmptyState onCreateNew={() => setIsModalOpen(true)} />
                ) : (
                    <>
                        <ProjectsTable
                            projects={paginatedProjects}
                            onNavigate={(id) => navigate(`/project/${id}`)}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteClick}
                        />
                        {filteredProjects.length === 0 && (
                            <div className="text-center py-12 text-gray-500 font-medium">
                                No projects match your search.
                            </div>
                        )}
                    </>
                )
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
                        }}
                        onAdd={handleAddProject}
                        editingProject={editingProject}
                        onEdit={handleEditProject}
                    />

                    <DeleteConfirmationModal
                        isOpen={deleteConfirmation !== null}
                        onClose={() => setDeleteConfirmation(null)}
                        onConfirm={confirmDelete}
                        itemName={deleteConfirmation?.name}
                    />
                </>
            }
        />
    );
};
