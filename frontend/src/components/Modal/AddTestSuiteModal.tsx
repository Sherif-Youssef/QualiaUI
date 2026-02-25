import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface AddTestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; description: string }) => void;
  editingSuite?: { id: string; name: string; description: string } | null;
  onEdit?: (id: string, data: { name: string; description: string }) => void;
  error?: string | null;
  isLoading?: boolean;
}

export const AddTestSuiteModal: React.FC<AddTestSuiteModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  editingSuite,
  onEdit,
  error,
  isLoading
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  React.useEffect(() => {
    if (editingSuite) {
      setName(editingSuite.name);
      setDescription(editingSuite.description);
    } else {
      setName('');
      setDescription('');
    }
  }, [editingSuite, isOpen]);

  const handleSubmit = () => {
    if (!name.trim()) return;

    if (editingSuite && onEdit) {
      onEdit(editingSuite.id, { name, description });
    } else {
      onAdd({ name, description });
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            {editingSuite ? 'Edit Test Suite' : 'Create Test Suite'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-failure/10 border border-failure/20 rounded-xl flex items-center gap-3 text-failure text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="w-1.5 h-1.5 rounded-full bg-failure animate-pulse"></span>
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs uppercase tracking-wider font-bold text-gray-400 ml-1">
              Test Suite Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Checkout Flow Experience"
              className="px-4 py-3 rounded-xl border-gray-200 focus:ring-primary/20 transition-all"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs uppercase tracking-wider font-bold text-gray-400 ml-1">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are the key objectives of this suite?"
              className="px-4 py-3 rounded-xl border-gray-200 focus:ring-primary/20 transition-all min-h-[120px] resize-none"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 border-t border-gray-100">
          <Button onClick={onClose} variant="ghost" className="text-gray-500 hover:text-gray-700 font-medium">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-primary hover:bg-secondary text-white px-8 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{editingSuite ? 'Saving...' : 'Creating...'}</span>
              </div>
            ) : (
              editingSuite ? 'Save Changes' : 'Create Suite'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
