import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { BaseInput } from './ui/Baseinput';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { StepType, TestCase } from '../types';

interface StepDefinition {
  id: string;
  type: StepType;
  description: string;
  screenshot?: string;
}

interface AddTestCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTestCase: (data: {
    name: string;
    url: string;
    mode: 'do' | 'step-based';
    instruction?: string;
    steps?: StepDefinition[];
  }) => void;
  editingTestCase?: TestCase | null;
}

export const AddTestCaseModal: React.FC<AddTestCaseModalProps> = ({
  isOpen,
  onClose,
  onCreateTestCase,
  editingTestCase,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<'do' | 'step-based'>('do');
  const [instruction, setInstruction] = useState('');
  const [steps, setSteps] = useState<StepDefinition[]>([
    { id: '1', type: 'do', description: '', screenshot: '' },
  ]);

  useEffect(() => {
    if (editingTestCase) {
      setName(editingTestCase.name);
      setUrl(editingTestCase.url || '');
      setMode(editingTestCase.mode || 'do');
      setInstruction(editingTestCase.instruction);
      
      if (editingTestCase.mode === 'step-based') {
        setSteps(editingTestCase.steps.map(step => ({
          id: step.id,
          type: step.type || 'do',
          description: step.text.replace(/^(DO|CHECK|WAIT):\s*/i, ''),
          screenshot: step.screenshot,
        })));
      } else {
        setSteps([{
          id: editingTestCase.steps[0]?.id || '1',
          type: 'do',
          description: editingTestCase.instruction,
          screenshot: editingTestCase.steps[0]?.screenshot,
        }]);
      }
    } else {
      setName('');
      setUrl('');
      setMode('do');
      setInstruction('');
      setSteps([{ id: '1', type: 'do', description: '', screenshot: '' }]);
    }
  }, [editingTestCase, isOpen]);

  const handleAddStep = () => {
    const newStep: StepDefinition = {
      id: Date.now().toString(),
      type: 'do',
      description: '',
      screenshot: '',
    };
    setSteps([...steps, newStep]);
  };

  const handleRemoveStep = (stepId: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter(step => step.id !== stepId));
    }
  };

  const handleStepTypeChange = (stepId: string, type: StepType) => {
    setSteps(steps.map(step =>
      step.id === stepId ? { ...step, type } : step
    ));
  };

  const handleStepDescriptionChange = (stepId: string, description: string) => {
    setSteps(steps.map(step =>
      step.id === stepId ? { ...step, description } : step
    ));
  };


  const handleCreate = () => {
    if (!name.trim()) {
      alert('Please enter a test case name');
      return;
    }

    if (!url.trim()) {
      alert('Please enter a website URL');
      return;
    }

    if (mode === 'do' && !instruction.trim()) {
      alert('Please enter a test instruction');
      return;
    }

    if (mode === 'step-based' && steps.some(step => !step.description.trim())) {
      alert('Please fill in all step descriptions');
      return;
    }

    onCreateTestCase({
      name,
      url,
      mode,
      instruction: mode === 'do' ? instruction : undefined,
      steps: mode === 'step-based' ? steps : undefined,
    });

    setName('');
    setUrl('');
    setMode('do');
    setInstruction('');
    setSteps([{ id: '1', type: 'do', description: '' }]);
  };

  const handleCancel = () => {
    setName('');
    setUrl('');
    setMode('do');
    setInstruction('');
    setSteps([{ id: '1', type: 'do', description: '' }]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-headline-md font-sans font-semibold text-foreground">
            {editingTestCase ? 'Edit Test Case' : 'Add New Test Case'}
          </h2>
          <Button
            onClick={handleCancel}
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
            <Label htmlFor="name" className="text-body-lg font-body font-medium text-foreground">
              Test Case Name <span className="text-failure">*</span>
            </Label>
            <BaseInput
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Login Flow Test"
              className="bg-background text-foreground border-border font-body text-body-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url" className="text-body-lg font-body font-medium text-foreground">
              Website URL for this test case <span className="text-failure">*</span>
            </Label>
            <BaseInput
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="bg-background text-foreground border-border font-body text-body-lg"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-body-lg font-body font-medium text-foreground">
              Test Definition Method <span className="text-failure">*</span>
            </Label>
            
            <RadioGroup value={mode} onValueChange={(value) => setMode(value as 'do' | 'step-based')}>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="do" id="mode-do" className="mt-1" />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="mode-do" className="text-body-lg font-body font-medium text-foreground cursor-pointer">
                      Do (Plain English)
                    </Label>
                    {mode === 'do' && (
                      <BaseInput
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        placeholder="e.g., Add a red shirt to the basket"
                        className="bg-background text-foreground border-border font-body text-body-md"
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="step-based" id="mode-step-based" className="mt-1" />
                  <div className="flex-1 space-y-3">
                    <Label htmlFor="mode-step-based" className="text-body-lg font-body font-medium text-foreground cursor-pointer">
                      Step-Based Instruction
                    </Label>
                    
                    {mode === 'step-based' && (
                      <div className="space-y-3">
                        {steps.map((step, index) => (
                          <div key={step.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <span className="text-body-md font-body font-medium text-muted-foreground mt-2 flex-shrink-0">
                              {index + 1}.
                            </span>
                            
                            <Select
                              value={step.type}
                              onValueChange={(value) => handleStepTypeChange(step.id, value as StepType)}
                            >
                              <SelectTrigger className="w-32 bg-background text-foreground border-border font-body text-body-md">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="do">Do</SelectItem>
                                <SelectItem value="check">Check</SelectItem>
                                <SelectItem value="wait">Wait</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <BaseInput
                              value={step.description}
                              onChange={(e) => handleStepDescriptionChange(step.id, e.target.value)}
                              placeholder="Enter step description..."
                              className="flex-1 bg-background text-foreground border-border font-body text-body-md"
                            />
                            
                            <Button
                              onClick={() => handleRemoveStep(step.id)}
                              variant="ghost"
                              size="icon"
                              className="bg-transparent text-failure hover:bg-failure/10 hover:text-failure flex-shrink-0"
                              disabled={steps.length === 1}
                              aria-label="Remove step"
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                            </Button>
                          </div>
                        ))}
                        
                        <Button
                          onClick={handleAddStep}
                          variant="outline"
                          className="w-full bg-transparent text-foreground border-border hover:bg-muted hover:text-foreground font-body font-normal"
                        >
                          <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                          Add Step
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="bg-transparent text-foreground border-border hover:bg-muted hover:text-foreground font-body font-normal"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-body font-normal"
          >
            {editingTestCase ? 'Save Changes' : 'Create Test Case'}
          </Button>
        </div>
      </div>
    </div>
  );
};
