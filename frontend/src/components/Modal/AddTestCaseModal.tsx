import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { TestCase } from '@/types/test-case';
import { Textarea } from '../ui/textarea';
import { ErrorMessage } from '../GeneralComponents';

interface AddTestCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTestCase?: TestCase | null;
  onSave: (data: {
    name: string;
    description: string;
    preconditions: string;
    objectives: string;
    url: string;
    plainText: string;
  }) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const AddTestCaseModal: React.FC<AddTestCaseModalProps> = ({
  isOpen,
  onClose,
  editingTestCase,
  onSave,
  isLoading = false,
  error = null,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [preconditions, setPreconditions] = useState('');
  const [objectives, setObjectives] = useState('');
  const [url, setUrl] = useState('');
  const [plainText, setPlainText] = useState('');

  useEffect(() => {
    if (editingTestCase) {
      setName(editingTestCase.name);
      setDescription(editingTestCase.description || '');
      setPreconditions(editingTestCase.preconditions || '');
      setObjectives(editingTestCase.objectives || '');
      setUrl(editingTestCase.url);
      setPlainText(editingTestCase.plainText || '');
    } else {
      setName('');
      setDescription('');
      setPreconditions('');
      setObjectives('');
      setUrl('');
      setPlainText('');
    }
  }, [editingTestCase, isOpen]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (!url.trim()) return;
    if (!plainText.trim()) return;

    onSave({
      name,
      description,
      preconditions,
      objectives,
      url,
      plainText,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-bold text-gray-800 font-sans">
            {editingTestCase ? 'Edit Test Case' : 'Add Test Case'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white [scrollbar-width:thin] [scrollbar-color:#E5E7EB_transparent]">
          {error && <ErrorMessage message={error} />}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-2 block">
                Test Case Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Login with valid credentials"
                className="mt-1 h-11"
                disabled={isLoading}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="url" className="text-sm font-semibold text-gray-700 mb-2 block">
                Website URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="mt-1 h-11"
                disabled={isLoading}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700 mb-2 block">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what this test case does"
                className="mt-1 min-h-[80px]"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="preconditions" className="text-sm font-semibold text-gray-700 mb-2 block">
                Preconditions
              </Label>
              <Textarea
                id="preconditions"
                value={preconditions}
                onChange={(e) => setPreconditions(e.target.value)}
                placeholder="What needs to be true before starting"
                className="mt-1 min-h-[100px]"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="objectives" className="text-sm font-semibold text-gray-700 mb-2 block">
                Objectives
              </Label>
              <Textarea
                id="objectives"
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="Desired outcome"
                className="mt-1 min-h-[100px]"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700 block">
              Prompt Instructions <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={plainText}
              onChange={(e) => setPlainText(e.target.value)}
              placeholder="Describe your test scenario... (e.g., Navigate to login, fill email and pass, then click sign in)"
              className="min-h-[160px] bg-white text-gray-700 border-gray-200 focus:border-primary"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50/50">
          <Button onClick={onClose} variant="secondary" className="px-6 h-11" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="px-8 h-11 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 transition-all font-bold"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </div>
            ) : (
              editingTestCase ? 'Save Changes' : 'Create Test Case'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
