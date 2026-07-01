import React from 'react';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';
import { AddProjectModal } from '@/components/Modal/AddProjectModal';
import { DeleteConfirmationModal } from '@/components/Modal/DeleteConfirmationModal';
import { ViewProjectModal } from '@/components/Modal/ViewProjectModal';
import { ErrorMessage } from '@/components/GeneralComponents';

import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { ProjectsHeader } from "./ProjectsHeader";
import { ProjectsEmptyState } from "./ProjectsEmptyState";
import { ProjectsTable } from "./ProjectsTable";
import { useProjects } from './hooks/useProjects';

export const ProjectsPage: React.FC = () => {
    const {
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
    } = useProjects();

    return (
        <DashboardLayout
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
                                onViewDetails={handleViewDetailsClick}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                                isAdmin={isAdminState}
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
                    <ViewProjectModal
                        isOpen={isViewModalOpen}
                        onClose={() => {
                            setIsViewModalOpen(false);
                            setViewingProject(null);
                        }}
                        project={viewingProject}
                    />

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
