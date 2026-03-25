import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ErrorMessage } from '../GeneralComponents';

interface EditStepModalProps {
  step: {
    number: number;
    text: string;
    [key: string]: any;
  };
  onSave: (updatedText: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

export const EditStepModal: React.FC<EditStepModalProps> = ({
  step,
  onSave,
  onCancel,
  isLoading = false,
  error = null,
  onClearError
}) => {
  const [stepText, setStepText] = useState(step.text);

  useEffect(() => {
    setStepText(step.text);
  }, [step]);

  const handleSave = () => {
    if (!stepText.trim()) return;
    onSave(stepText);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-800 font-sans">Edit Step {step.number}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" strokeWidth={2} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && <ErrorMessage message={error} onClose={onClearError} />}

          <div>
            <Label htmlFor="step-text" className="text-sm font-semibold text-gray-700 mb-2 block">
              Step Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="step-text"
              value={stepText}
              onChange={(e) => setStepText(e.target.value)}
              placeholder="What should happen in this step?"
              className="mt-1 min-h-[150px] border-gray-200 focus:border-primary"
              autoFocus
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50/50 rounded-b-xl">
          <Button onClick={onCancel} variant="secondary" className="px-6 h-11" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="px-8 h-11 bg-primary hover:bg-primary/90 text-white font-bold"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </div>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
