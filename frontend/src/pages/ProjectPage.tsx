import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { TopNav } from '../components/TopNav';
import { SearchBar } from '../components/SearchBar';
import { Pagination } from '../components/Pagination';
import { Button } from '../components/ui/button';
import { AddTestSuiteModal } from '../components/AddTestSuiteModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmation';
import { TestSuite } from '../types';

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

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmation({ id, name });
  };

  const confirmDelete = () => {
    if (deleteConfirmation) {
      setTestSuites(testSuites.filter(suite => suite.id !== deleteConfirmation.id));
      setDeleteConfirmation(null);
    }
  };

  const handleEdit = (suite: TestSuite, e: React.MouseEvent) => {
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
      projectId: 'proj-1',
      name: data.name,
      description: data.description,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTestSuites([...testSuites, newSuite]);
    setIsModalOpen(false);
    setEditingSuite(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-sans font-semibold text-gray-800">Test Suites</h2>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all"
          >
            <Plus className="w-5 h-5 mr-2" strokeWidth={2} />
            Add Test Suite
          </Button>
        </div>

        <div className="mb-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search Test Suite..."
          />
        </div>

        <div className="space-y-3">
          {paginatedSuites.map((suite) => (
            <div
              key={suite.id}
              onClick={() => navigate(`/project/${projectId}/suite/${suite.id}`)}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 group-hover:text-primary transition-colors">
                    {suite.name}
                  </h3>
                  {suite.description && (
                    <p className="text-sm text-gray-500 mt-1">{suite.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleEdit(suite, e)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"
                  >
                    <Pencil className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(suite.id, suite.name, e)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSuites.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No test suites found
          </div>
        )}
        {filteredSuites.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredSuites.length}
            onPageChange={setCurrentPage}
          />
        )}
      </main>

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
    </div>
  );
};
