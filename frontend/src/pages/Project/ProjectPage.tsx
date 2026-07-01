import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';
import { ErrorMessage } from '@/components/GeneralComponents';
import { AddTestSuiteModal } from '@/components/Modal/AddTestSuiteModal';
import { AddMemberModal } from '@/components/Modal/AddMemberModal';
import { ViewTestSuiteModal } from '@/components/Modal/ViewTestSuiteModal';
import { DeleteConfirmationModal } from '@/components/Modal/DeleteConfirmationModal';

import { ProjectLayout } from './ProjectLayout';
import { ProjectHeader } from './ProjectHeader';
import { ProjectTabs } from './ProjectTabs';
import { ProjectTestSuiteView } from './ProjectTestSuiteView';
import { ProjectTeamView } from './ProjectTeamView';
import { useProjectWorkspace } from './hooks/useProjectWorkspace';

export const ProjectPage: React.FC = () => {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();

    const {
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
        viewingSuite, setViewingSuite,
        isViewSuiteModalOpen, setIsViewSuiteModalOpen,
        editingSuite, setEditingSuite,
        deleteSuiteConfirmation, setDeleteSuiteConfirmation,
        handleAddTestSuite,
        handleViewSuiteClick,
        handleEditSuiteClick,
        handleEditTestSuite,
        handleDeleteSuiteClick,
        handleDeleteTestSuite,
        handleMemberAdd,
        removeMemberConfirmation, setRemoveMemberConfirmation,
        handleRemoveMemberClick,
        confirmRemoveMember,
    } = useProjectWorkspace({ projectId });
    return (
        <ProjectLayout
            header={
                <ProjectHeader
                    projectName={projectName}
                    onBack={() => navigate('/projects')}
                    onAddSuite={() => {
                        setEditingSuite(null);
                        setModalError(null);
                        setIsModalOpen(true);
                    }}
                />
            }
            searchBar={
                <div className="space-y-4">
                    <ProjectTabs activeView={activeView} onViewChange={(v) => { setActiveView(v); setCurrentPage(1); }} />
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder={activeView === 'suites' ? "Search Test Suite..." : "Search Team Members..."}
                    />
                </div>
            }
            content={
                <>
                    {error && <div className="mb-6"><ErrorMessage message={error} onClose={() => setError(null)} /></div>}

                    {activeView === 'suites' && (
                        <ProjectTestSuiteView
                            suites={testSuites}
                            isLoading={isLoading}
                            isTrulyEmpty={totalItems === 0 && debouncedSearch === '' && !isLoading}
                            isSearchEmpty={testSuites.length === 0 && debouncedSearch !== '' && !isLoading}
                            canManageSuites={canManageSuites}
                            onAddSuite={() => {
                                setEditingSuite(null);
                                setModalError(null);
                                setIsModalOpen(true);
                            }}
                            onNavigate={(id) => navigate(`/project/${projectId}/suite/${id}`)}
                            onViewDetails={handleViewSuiteClick}
                            onEdit={handleEditSuiteClick}
                            onDelete={handleDeleteSuiteClick}
                        />
                    )}

                    {activeView === 'team' && (
                        <ProjectTeamView
                            members={projectMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                            isLoading={isLoading}
                            canManageProject={canManageProject}
                            onInvite={() => setIsAddMemberModalOpen(true)}
                            onRemoveMember={handleRemoveMemberClick}
                        />
                    )}
                </>
            }
            pagination={totalItems > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalItems / itemsPerPage)}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalItems}
                    onPageChange={setCurrentPage}
                />
            )}
            modals={
                <>
                    <ViewTestSuiteModal
                        isOpen={isViewSuiteModalOpen}
                        onClose={() => {
                            setIsViewSuiteModalOpen(false);
                            setViewingSuite(null);
                        }}
                        suite={viewingSuite}
                    />

                    <AddTestSuiteModal
                        isOpen={isModalOpen}
                        onClose={() => {
                            setIsModalOpen(false);
                            setEditingSuite(null);
                            setModalError(null);
                        }}
                        onAdd={handleAddTestSuite}
                        editingSuite={editingSuite}
                        onEdit={handleEditTestSuite}
                        error={modalError}
                        onClearError={() => setModalError(null)}
                        isLoading={modalLoading}
                    />

                    <DeleteConfirmationModal
                        isOpen={deleteSuiteConfirmation !== null}
                        onClose={() => {
                            setDeleteSuiteConfirmation(null);
                            setModalError(null);
                        }}
                        onConfirm={handleDeleteTestSuite}
                        itemName={deleteSuiteConfirmation?.name}
                        error={modalError}
                        onClearError={() => setModalError(null)}
                        isLoading={modalLoading}
                    />

                    <AddMemberModal
                        isOpen={isAddMemberModalOpen}
                        onClose={() => {
                            setIsAddMemberModalOpen(false);
                            setModalError(null);
                        }}
                        onAdd={handleMemberAdd}
                        isLoading={modalLoading}
                        error={modalError}
                        onClearError={() => setModalError(null)}
                    />

                    <DeleteConfirmationModal
                        isOpen={removeMemberConfirmation !== null}
                        onClose={() => {
                            setRemoveMemberConfirmation(null);
                            setModalError(null);
                        }}
                        onConfirm={confirmRemoveMember}
                        itemName={removeMemberConfirmation?.name}
                        error={modalError}
                        onClearError={() => setModalError(null)}
                        isLoading={modalLoading}
                    />
                </>
            }
        />
    );
};
