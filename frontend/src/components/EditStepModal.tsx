import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { TestStep } from '../types';

interface EditStepModalProps {
  step: TestStep;
  onSave: (updatedText: string) => void;
  onCancel: () => void;
}

export const EditStepModal: React.FC<EditStepModalProps> = ({
  step,
  onSave,
  onCancel,
}) => {
  const [stepText, setStepText] = useState(step.text);

  useEffect(() => {
    setStepText(step.text);
  }, [step]);

  const handleSave = () => {
    if (!stepText.trim()) {
      alert('Step text cannot be empty');
      return;
    }
    onSave(stepText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Edit Step {step.number}</h2>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label htmlFor="step-text" className="text-sm font-medium text-gray-700 mb-1.5">
              Step Text <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="step-text"
              value={stepText}
              onChange={(e) => setStepText(e.target.value)}
              placeholder="Enter step description..."
              className="mt-1 min-h-[150px]"
              autoFocus
            />
          </div>
        </div>
     <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <Button onClick={onCancel} variant="outline" className="border-gray-300">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
