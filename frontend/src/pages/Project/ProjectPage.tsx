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
import { ProjectModals } from './ProjectModals';
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
        handleAddTestSuite,
        handleMemberAdd,
        handleMemberRemove,
    } = useProjectWorkspace({ projectId });
    return (
        <ProjectLayout
            header={
                <ProjectHeader
                    projectName={projectName}
                    onBack={() => navigate('/projects')}
                    onAddSuite={() => setIsModalOpen(true)}
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
                            onAddSuite={() => setIsModalOpen(true)}
                            onNavigate={(id) => navigate(`/project/${projectId}/suite/${id}`)}
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
                    onCloseSuiteModal={() => setIsModalOpen(false)}
                    onAddSuite={handleAddTestSuite}
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
