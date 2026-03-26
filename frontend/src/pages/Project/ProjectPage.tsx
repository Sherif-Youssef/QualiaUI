import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';
import { AddTestSuiteModal } from '@/components/Modal/AddTestSuiteModal';
import { DeleteConfirmationModal } from '@/components/Modal/DeleteConfirmationModal';
import { TestSuite } from '@/types/test-suit';
import { testSuiteService } from '@/services/testSuiteService';
import { projectService } from '@/services/project/projectService';

import { useProjectPermissions } from '@/hooks/useProjectPermissions';
import { ProjectLayout } from './ProjectLayout';
import { ProjectHeader } from './ProjectHeader';
import { TestSuiteList } from './TestSuiteList';
import { ErrorMessage } from '@/components/GeneralComponents';
import { TestSuitEmptyState } from './TestSuitEmptyState';

export const ProjectPage: React.FC = () => {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSuite, setEditingSuite] = useState<TestSuite | null>(null);
    const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [totalSuites, setTotalSuites] = useState(0);
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

    const { canManageSuites, canManageProject } = useProjectPermissions(projectId);
    const itemsPerPage = 6;


    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const fetchData = async () => {
            if (!projectId) return;

            setIsLoading(true);
            setError(null);
            try {
                const offset = (currentPage - 1) * itemsPerPage;
                const [suitesResult] = await Promise.all([
                    testSuiteService.getTestSuites(projectId, offset, itemsPerPage, debouncedSearch),
                    projectService.getProjectById(projectId)
                ]);
                setTestSuites(suitesResult.testSuites);
                setTotalSuites(suitesResult.total);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load test suites.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [projectId, currentPage, debouncedSearch]);

    const totalPages = Math.ceil(totalSuites / itemsPerPage);


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
            await testSuiteService.deleteTestSuite(projectId!, deleteConfirmation.id);
            setTestSuites(testSuites.filter(suite => suite.id !== deleteConfirmation.id));
            setDeleteConfirmation(null);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to delete test suite.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleEditClick = (suite: TestSuite, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingSuite(suite);
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleEditTestSuite = async (id: string, data: { name: string; description: string }) => {
        setModalLoading(true);
        setModalError(null);
        try {
            const updatedSuite = await testSuiteService.updateTestSuite(projectId!, id, data);
            setTestSuites(testSuites.map(suite =>
                suite.id === id ? updatedSuite : suite
            ));
            setIsModalOpen(false);
            setEditingSuite(null);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to update test suite.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleAddTestSuite = async (data: { name: string; description: string }) => {
        if (!projectId) return;

        setModalLoading(true);
        setModalError(null);
        try {
            const newSuite = await testSuiteService.createTestSuite(projectId, data);
            setTestSuites([...testSuites, newSuite]);
            setIsModalOpen(false);
            setEditingSuite(null);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to create test suite.');
        } finally {
            setModalLoading(false);
        }
    };

    const isEmpty = testSuites.length === 0 && !isLoading;
    return (
        <ProjectLayout
            header={<ProjectHeader 
                projectId={projectId!}
                onAddSuite={() => {
                    setModalError(null);
                    setIsModalOpen(true);
                }} 
                canManageSuites={canManageSuites} 
                canManageProject={canManageProject}
            />}
            searchBar={!isEmpty && (
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search Test Suite..."
                />
            )}
            content={
                <>
                    {error && <div className="mb-6"><ErrorMessage message={error} onClose={() => setError(null)} /></div>}

                    {isLoading && testSuites.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 font-medium">Loading project data...</p>
                        </div>
                    ) : isEmpty ? (
                        <TestSuitEmptyState canManageSuites={canManageSuites} onCreate={() => {
                            setModalError(null);
                            setIsModalOpen(true);
                        }} />
                    ) : (
                        <>
                            <TestSuiteList
                                suites={testSuites}
                                onNavigate={(suiteId) => navigate(`/project/${projectId}/suite/${suiteId}`)}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                                canManageSuites={canManageSuites}
                            />
                            {testSuites.length === 0 && !isLoading && (
                                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                    <p className="text-gray-500 font-medium">No test suites match your search.</p>
                                </div>
                            )}
                        </>
                    )}
                </>
            }
            pagination={totalSuites > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalSuites}
                    onPageChange={setCurrentPage}
                />
            )}
            modals={
                <>
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
