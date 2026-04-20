import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div 
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg border border-gray-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-white">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Edit Step {step.number}</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Update the instruction for this test case</p>
          </div>
          <button 
            onClick={onCancel} 
            className="p-3 hover:bg-gray-50 rounded-2xl transition-all active:scale-90"
          >
            <X className="w-6 h-6 text-gray-400" strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {error && <ErrorMessage message={error} onClose={onClearError} />}

          <div className="space-y-2">
            <Label htmlFor="step-text" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">
              Step Description <span className="text-primary">*</span>
            </Label>
            <Textarea
              id="step-text"
              value={stepText}
              onChange={(e) => setStepText(e.target.value)}
              placeholder="Describe the action to be performed..."
              className="mt-1 min-h-[180px] rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold leading-relaxed p-5"
              autoFocus
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-8 border-t border-gray-100 bg-gray-50/50">
          <Button onClick={onCancel} variant="ghost" className="px-6 h-12 rounded-xl font-bold" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="px-10 h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
