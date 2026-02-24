import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; description: string }) => void;
  editingProject?: { id: string; name: string; description: string } | null;
  onEdit?: (id: string, data: { name: string; description: string }) => void;
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  editingProject,
  onEdit 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

    React.useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setDescription(editingProject.description);
    } else {
      setName('');
      setDescription('');
    }
  }, [editingProject, isOpen]);

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Please enter a project name');
      return;
    }
    
    if (editingProject && onEdit) {
      onEdit(editingProject.id, { name, description });
    } else {
      onAdd({ name, description });
    }
    
    setName('');
    setDescription('');
    };
    
     if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {editingProject ? 'Edit Project' : 'Add Project'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
          </button>
              </div>
      
       <div className="p-6 space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1.5">
              Project Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., E-commerce Platform"
              className="mt-1"
            />
                  </div>
      
        <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-1.5">
              Project Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this project..."
              className="mt-1 min-h-[100px]"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <Button onClick={onClose} variant="outline" className="border-gray-300">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-white">
            {editingProject ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </div>
    </div>
  );
};
