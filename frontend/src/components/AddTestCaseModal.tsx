import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { TestCaseStep, TestCase } from '../types';
import { Textarea } from '../components/ui/textarea';


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
}

export const AddTestCaseModal: React.FC<AddTestCaseModalProps> = ({
  isOpen,
  onClose,
  editingTestCase,
  onSave,
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
      setMode(editingTestCase.mode);
      setPlainText(editingTestCase.plainText || '');
      setSteps(editingTestCase.steps || [{ id: '1', type: 'do', description: '' }]);
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
    if (!name.trim()) {
      alert('Please enter a test case name');
      return;
    }
    if (!url.trim()) {
      alert('Please enter a website URL');
      return;
    }
    if (mode === 'plain' && !plainText.trim()) {
      alert('Please enter a test description');
      return;
    }
    if (mode === 'step-based' && steps.some(s => !s.description.trim())) {
      alert('Please fill in all step descriptions');
      return;
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {editingTestCase ? 'Edit Test Case' : 'Add Test Case'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1.5">
              Test Case Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Login with valid credentials"
              className="mt-1"
            />
         </div>
    <div>
            <Label htmlFor="url" className="text-sm font-medium text-gray-700 mb-1.5">
              Website URL for this Test Case <span className="text-red-500">*</span>
            </Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="mt-1"
            />
         </div>
   <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700">
              Test Definition Method <span className="text-red-500">*</span>
            </Label>

            <RadioGroup value={mode} onValueChange={(value) => setMode(value as 'plain' | 'step-based')}>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="plain" id="mode-plain" className="mt-1" />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="mode-plain" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Plain English
                    </Label>
                    {mode === 'plain' && (
                      <Textarea
                        value={plainText}
                        onChange={(e) => setPlainText(e.target.value)}
                        placeholder="e.g., Add a red shirt to the basket"
                        className="min-h-[100px]"
                      />
                    )}
                  </div>
               </div>
   
   <div className="flex items-start space-x-3">
                  <RadioGroupItem value="step-based" id="mode-step-based" className="mt-1" />
                  <div className="flex-1 space-y-3">
                    <Label htmlFor="mode-step-based" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Step-Based Instructions
                    </Label>

                    {mode === 'step-based' && (
                      <div className="space-y-3">
                        {steps.map((step, index) => (
                          <div key={step.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-sm font-medium text-gray-600 mt-2 flex-shrink-0">
                              {index + 1}.
                            </span>
 <Select
                              value={step.type}
                              onValueChange={(value) => handleStepTypeChange(step.id, value as 'do' | 'check' | 'wait')}
                            >
                              <SelectTrigger className="w-32">
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
                              placeholder="Enter step description..."
                              className="flex-1"
                            />
          <Button
                              onClick={() => handleRemoveStep(step.id)}
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600 flex-shrink-0"
                              disabled={steps.length === 1}
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                            </Button>
                          </div>
                        ))}

                        <Button
                          onClick={handleAddStep}
                          variant="outline"
                          className="w-full border-gray-300 hover:bg-gray-500"
                        >
                          <Plus className="w-4 h-4 mr-2" strokeWidth={2} />
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

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <Button onClick={onClose} variant="outline" className="border-gray-300">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-white">
            {editingTestCase ? 'Save Changes' : 'Add Test Case'}
          </Button>
        </div>
      </div>
    </div>
  );
};
