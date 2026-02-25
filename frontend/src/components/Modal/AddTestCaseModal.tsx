import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TestCaseStep, TestCase } from '@/types/test-case';
import { Textarea } from '../ui/textarea';
import { ErrorMessage } from '../GeneralComponents';

interface AddTestCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTestCase?: TestCase | null;
  onSave: (data: {
    name: string;
    url: string;
    mode: 'plain' | 'step-based';
    plainText?: string;
    steps?: TestCaseStep[];
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
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<'plain' | 'step-based'>('plain');
  const [plainText, setPlainText] = useState('');
  const [steps, setSteps] = useState<TestCaseStep[]>([
    { id: '1', type: 'do', description: '' },
  ]);

  useEffect(() => {
    if (editingTestCase) {
      setName(editingTestCase.name);
      setUrl(editingTestCase.url);
      setMode(editingTestCase.mode || 'plain');
      setPlainText(editingTestCase.plainText || '');
      setSteps((editingTestCase.steps as TestCaseStep[]) || [{ id: '1', type: 'do', description: '' }]);
    } else {
      setName('');
      setUrl('');
      setMode('plain');
      setPlainText('');
      setSteps([{ id: '1', type: 'do', description: '' }]);
    }
  }, [editingTestCase, isOpen]);

  const handleAddStep = () => {
    setSteps([...steps, { id: Date.now().toString(), type: 'do', description: '' }]);
  };

  const handleRemoveStep = (stepId: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter(s => s.id !== stepId));
    }
  };

  const handleStepTypeChange = (stepId: string, type: 'do' | 'check' | 'wait') => {
    setSteps(steps.map(s => (s.id === stepId ? { ...s, type } : s)));
  };

  const handleStepDescriptionChange = (stepId: string, description: string) => {
    setSteps(steps.map(s => (s.id === stepId ? { ...s, description } : s)));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (!url.trim()) return;
    if (mode === 'plain' && !plainText.trim()) return;
    if (mode === 'step-based' && steps.some(s => !s.description.trim())) return;

    onSave({
      name,
      url,
      mode,
      plainText: mode === 'plain' ? plainText : undefined,
      steps: mode === 'step-based' ? steps : undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
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

          <div>
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

          <div>
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

          <div className="space-y-4">
            <Label className="text-sm font-semibold text-gray-700 block">
              Test Definition Method <span className="text-red-500">*</span>
            </Label>

            <RadioGroup value={mode} onValueChange={(value) => setMode(value as 'plain' | 'step-based')} disabled={isLoading}>
              <div className="grid gap-4">
                <div className={`p-4 rounded-xl border-2 transition-all ${mode === 'plain' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}>
                  <div className="flex items-center space-x-3 mb-3">
                    <RadioGroupItem value="plain" id="mode-plain" />
                    <Label htmlFor="mode-plain" className="text-sm font-bold text-gray-800 cursor-pointer">
                      Plain English Instructions
                    </Label>
                  </div>
                  {mode === 'plain' && (
                    <Textarea
                      value={plainText}
                      onChange={(e) => setPlainText(e.target.value)}
                      placeholder="Describe your test scenario... (e.g., Navigate to login, fill email and pass, then click sign in)"
                      className="min-h-[120px] bg-white text-gray-700 border-gray-200 focus:border-primary"
                      disabled={isLoading}
                    />
                  )}
                </div>

                <div className={`p-4 rounded-xl border-2 transition-all ${mode === 'step-based' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}>
                  <div className="flex items-center space-x-3 mb-4">
                    <RadioGroupItem value="step-based" id="mode-step-based" />
                    <Label htmlFor="mode-step-based" className="text-sm font-bold text-gray-800 cursor-pointer">
                      Step-by-Step Instructions
                    </Label>
                  </div>

                  {mode === 'step-based' && (
                    <div className="space-y-3">
                      {steps.map((step, index) => (
                        <div key={step.id} className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm relative group">
                          <span className="text-xs font-bold text-gray-400 w-5">
                            {index + 1}.
                          </span>
                          <Select
                            value={step.type}
                            onValueChange={(value) => handleStepTypeChange(step.id, value as 'do' | 'check' | 'wait')}
                            disabled={isLoading}
                          >
                            <SelectTrigger className="w-full sm:w-28 h-10 border-gray-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="do">Do</SelectItem>
                              <SelectItem value="check">Check</SelectItem>
                              <SelectItem value="wait">Wait</SelectItem>
                            </SelectContent>
                          </Select>

                          <Input
                            value={step.description}
                            onChange={(e) => handleStepDescriptionChange(step.id, e.target.value)}
                            placeholder="Instruction detail..."
                            className="flex-1 h-10 border-gray-200"
                            disabled={isLoading}
                          />
                          <Button
                            onClick={() => handleRemoveStep(step.id)}
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                            disabled={steps.length === 1 || isLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}

                      <Button
                        onClick={handleAddStep}
                        variant="outline"
                        className="w-full h-11 border-dashed border-2 border-gray-300 hover:border-primary hover:text-primary transition-all rounded-xl"
                        disabled={isLoading}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Next Step
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </RadioGroup>
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
