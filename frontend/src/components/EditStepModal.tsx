import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ActionStep } from '../types';

interface EditStepModalProps {
  step: ActionStep;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-headline-md font-sans font-semibold text-foreground">
            Edit Step {step.number}
          </h2>
          <Button
            onClick={onCancel}
            variant="ghost"
            size="icon"
            className="bg-transparent text-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="step-text" className="text-body-lg font-body font-medium text-foreground">
              Step Text <span className="text-failure">*</span>
            </Label>
            <Textarea
              id="step-text"
              value={stepText}
              onChange={(e) => setStepText(e.target.value)}
              placeholder="Enter step description..."
              className="bg-background text-foreground border-border font-body text-body-lg min-h-[150px] resize-y"
              autoFocus
            />
          </div>

          {step.type && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-body-md font-body font-medium text-muted-foreground">
                  Step Type:
                </span>
                <span className="text-body-md font-body font-semibold text-foreground uppercase">
                  {step.type}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
          <Button
            onClick={onCancel}
            variant="outline"
            className="bg-transparent text-foreground border-border hover:bg-muted hover:text-foreground font-body font-normal"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-body font-normal"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
