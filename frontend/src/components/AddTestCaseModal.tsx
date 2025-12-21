import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { BaseInput } from './ui/Baseinput';
import { Label } from '../components/ui/label';

interface AddTestCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTestCase: (data: {
    name: string;
    url: string;
    instruction: string;
  }) => void;
}

export const AddTestCaseModal: React.FC<AddTestCaseModalProps> = ({
  isOpen,
  onClose,
  onCreateTestCase,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [instruction, setInstruction] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setUrl('');
      setInstruction('');
    }
  }, [isOpen]);

  const handleCreate = () => {
    if (!name.trim()) {
      alert('Please enter a test case name');
      return;
    }

    if (!url.trim()) {
      alert('Please enter a website URL');
      return;
    }

    if (!instruction.trim()) {
      alert('Please enter a test instruction');
      return;
    }

    onCreateTestCase({
      name,
      url,
      instruction,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-headline-md font-sans font-semibold text-foreground">
            Add New Test Case
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="bg-transparent text-foreground hover:bg-muted"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-body-lg font-medium">
              Test Case Name <span className="text-failure">*</span>
            </Label>
            <BaseInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Checkout Flow Test"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-body-lg font-medium">
              Website URL <span className="text-failure">*</span>
            </Label>
            <BaseInput
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-body-lg font-medium">
              What should the test do? <span className="text-failure">*</span>
            </Label>
            <BaseInput
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g., Add a red shirt to the cart and proceed to checkout"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted/30">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-primary text-primary-foreground"
          >
            Create Test Case
          </Button>
        </div>
      </div>
    </div>
  );
};
