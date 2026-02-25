import React, { useState } from 'react';
import { Folder } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ModalHeader } from '../GeneralComponents';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg border border-gray-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <ModalHeader
          title={editingProject ? 'Edit Project' : 'Add Project'}
          subtitle={editingProject ? 'Modify project details' : 'Build something new today'}
          icon={Folder}
          onClose={onClose}
        />

        <div className="p-6 space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1.5 ml-1">
              Project Name <span className="text-failure">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., E-commerce Platform"
              className="mt-1 rounded-2xl h-12"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-1.5 ml-1">
              Project Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this project..."
              className="mt-1 min-h-[120px] rounded-2xl"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50/50 rounded-b-xl">
          <Button onClick={onClose} variant="outline" className="h-12 px-6 rounded-xl border-gray-300 font-bold">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-white h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20">
            {editingProject ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </div>
    </div>
  );
};
