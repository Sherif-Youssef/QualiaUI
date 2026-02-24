import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { TopNav } from '../components/TopNav';
import { SearchBar } from '../components/SearchBar';
import { Pagination } from '../components/Pagination';
import { Button } from '../components/ui/button';
import { AddProjectModal } from '../components/AddProjectModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmation';
import { Project } from '../types';

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

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmation({ id, name });
  };

  const confirmDelete = () => {
    if (deleteConfirmation) {
      setProjects(projects.filter(p => p.id !== deleteConfirmation.id));
      setDeleteConfirmation(null);
    }
    };
    
    const handleEdit = (project: Project, e: React.MouseEvent) => {
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
     if (projects.length === 0) {
   return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <main className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-12 h-12 text-primary" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-sans font-semibold text-gray-800 mb-2">No projects yet</h2>
              <p className="text-gray-500 mb-8">Create your first project to get started</p>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white shadow-lg px-8 py-6 text-lg rounded-xl transition-all hover:shadow-xl"
            >
              <Plus className="w-6 h-6 mr-2" strokeWidth={2} />
              Create New Project
            </Button>
          </div>
        </main>
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
      </div>
    );
  }
  // Projects exist - show table
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      
      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-sans font-semibold text-gray-800">Projects</h2>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all"
            >
              <Plus className="w-5 h-5 mr-2" strokeWidth={2} />
              Add Project
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search Projects..."
          />
    </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Project Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedProjects.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div>
                      <span className="text-sm font-medium text-gray-800 group-hover:text-primary transition-colors">
                        {project.name}
                      </span>
                      {project.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{project.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => handleEdit(project, e)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"
                      >
                        <Pencil className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(project.id, project.name, e)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
    </div>
        {filteredProjects.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No projects found
          </div>
        )}

        {filteredProjects.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredProjects.length}
            onPageChange={setCurrentPage}
          />
        )}
      </main>

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
    </div>
  );
};
