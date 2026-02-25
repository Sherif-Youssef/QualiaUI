import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';
import { AddTestSuiteModal } from '@/components/Modal/AddTestSuiteModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmation';
import { TestSuite } from '@/types';

// Sub-components
import { ProjectLayout } from './ProjectLayout';
import { ProjectHeader } from './ProjectHeader';
import { TestSuiteList } from './TestSuiteList';

export const ProjectPage: React.FC = () => {
    const navigate = useNavigate();
    const { projectId } = useParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSuite, setEditingSuite] = useState<TestSuite | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);
    const itemsPerPage = 6;

    const [testSuites, setTestSuites] = useState<TestSuite[]>([
        { id: '1', projectId: 'proj-1', name: 'Authentication Test Suite', description: 'Tests for login and signup flows', createdAt: '2024-01-15' },
        { id: '2', projectId: 'proj-1', name: 'E-commerce Checkout', description: 'End-to-end checkout process', createdAt: '2024-01-16' },
        { id: '3', projectId: 'proj-1', name: 'User Profile Management', description: 'Profile editing and settings', createdAt: '2024-01-17' },
        { id: '4', projectId: 'proj-1', name: 'Search Functionality', description: 'Product search and filters', createdAt: '2024-01-18' },
        { id: '5', projectId: 'proj-1', name: 'Payment Integration', description: 'Payment gateway tests', createdAt: '2024-01-19' },
        { id: '6', projectId: 'proj-1', name: 'Admin Dashboard', description: 'Admin panel functionality', createdAt: '2024-01-20' },
        { id: '7', projectId: 'proj-1', name: 'Notification System', description: 'Email and push notifications', createdAt: '2024-01-21' },
    ]);

    const filteredSuites = testSuites.filter(suite =>
        suite.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredSuites.length / itemsPerPage);
    const paginatedSuites = filteredSuites.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleDeleteClick = (id: string, name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirmation({ id, name });
    };

    const confirmDelete = () => {
        if (deleteConfirmation) {
            setTestSuites(testSuites.filter(suite => suite.id !== deleteConfirmation.id));
            setDeleteConfirmation(null);
        }
    };

    const handleEditClick = (suite: TestSuite, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingSuite(suite);
        setIsModalOpen(true);
    };

    const handleEditTestSuite = (id: string, data: { name: string; description: string }) => {
        setTestSuites(testSuites.map(suite =>
            suite.id === id ? { ...suite, name: data.name, description: data.description } : suite
        ));
        setIsModalOpen(false);
        setEditingSuite(null);
    };

    const handleAddTestSuite = (data: { name: string; description: string }) => {
        const newSuite: TestSuite = {
            id: Date.now().toString(),
            projectId: projectId || 'default',
            name: data.name,
            description: data.description,
            createdAt: new Date().toISOString().split('T')[0],
        };
        setTestSuites([...testSuites, newSuite]);
        setIsModalOpen(false);
        setEditingSuite(null);
    };

    return (
        <ProjectLayout
            header={<ProjectHeader onAddSuite={() => setIsModalOpen(true)} />}
            searchBar={
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search Test Suite..."
                />
            }
            content={
                <>
                    <TestSuiteList
                        suites={paginatedSuites}
                        onNavigate={(suiteId) => navigate(`/project/${projectId}/suite/${suiteId}`)}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                    />
                    {filteredSuites.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                            <p className="text-gray-500 font-medium">No test suites match your search.</p>
                        </div>
                    )}
                </>
            }
            pagination={filteredSuites.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredSuites.length}
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
                        }}
                        onAdd={handleAddTestSuite}
                        editingSuite={editingSuite}
                        onEdit={handleEditTestSuite}
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
