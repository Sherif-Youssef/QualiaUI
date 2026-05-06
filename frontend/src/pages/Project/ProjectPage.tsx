import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';
import { ErrorMessage } from '@/components/GeneralComponents';

import { ProjectLayout } from './ProjectLayout';
import { ProjectHeader } from './ProjectHeader';
import { ProjectTabs } from './ProjectTabs';
import { ProjectTestSuiteView } from './ProjectTestSuiteView';
import { ProjectTeamView } from './ProjectTeamView';
import { ProjectHistoryView } from './ProjectHistoryView';
import { ProjectModals } from './ProjectModals';
import { useProjectWorkspace } from './hooks/useProjectWorkspace';

export const ProjectPage: React.FC = () => {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();

    const {
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
    } = useProjectWorkspace({ projectId });
    return (
        <ProjectLayout
            header={
                <ProjectHeader
                    onBack={() => navigate('/projects')}
                    onAddSuite={() => setIsModalOpen(true)}
                />
            }
            searchBar={
                <div className="space-y-4">
                    <ProjectTabs activeView={activeView} onViewChange={(v) => { setActiveView(v); setCurrentPage(1); }} />
                    {activeView !== 'history' && (
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder={activeView === 'suites' ? "Search Test Suite..." : "Search Team Members..."}
                        />
                    )}
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
                            onAddSuite={() => setIsModalOpen(true)}
                            onNavigate={(id) => navigate(`/project/${projectId}/suite/${id}`)}
                            onEdit={(suite, e) => { e.stopPropagation(); setEditingSuite(suite); setIsModalOpen(true); }}
                            onDelete={(id, name, e) => { e.stopPropagation(); setDeleteConfirmation({ id, name }); }}
                        />
                    )}

                    {activeView === 'team' && (
                        <ProjectTeamView
                            members={projectMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                            isLoading={isLoading}
                            canManageProject={canManageProject}
                            onInvite={() => setIsAddMemberModalOpen(true)}
                            onRemoveMember={handleMemberRemove}
                        />
                    )}

                    {activeView === 'history' && (
                        <ProjectHistoryView
                            history={history}
                            isLoading={isLoading}
                            onView={(id) => navigate(`/project/${projectId}/history/${id}`)}
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
                <ProjectModals
                    isSuiteModalOpen={isModalOpen}
                    onCloseSuiteModal={() => { setIsModalOpen(false); setEditingSuite(null); }}
                    editingSuite={editingSuite}
                    onAddSuite={handleAddTestSuite}
                    onEditSuite={handleEditTestSuite}
                    deleteConfirmation={deleteConfirmation}
                    onCloseDeleteModal={() => setDeleteConfirmation(null)}
                    onConfirmDelete={confirmDelete}
                    isAddMemberModalOpen={isAddMemberModalOpen}
                    onCloseMemberModal={() => setIsAddMemberModalOpen(false)}
                    onAddMember={handleMemberAdd}
                    isLoading={modalLoading}
                    error={modalError}
                    onClearError={() => setModalError(null)}
                />
            }
        />
    );
};
