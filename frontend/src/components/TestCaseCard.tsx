import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, RotateCw, Camera, Circle, CheckCircle2, XCircle, Loader2, Pencil, ChevronsUpDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { TestCase, ActionStep } from '../types';
import { EditStepModal } from './EditStepModal';
import gsap from 'gsap';

interface TestCaseCardProps {
  testCase: TestCase;
  onRunTest: (testId: string) => void;
  onEditTest: (testCase: TestCase) => void;
  onStepClick: (step: ActionStep, testCase: TestCase) => void;
  onInstructionChange: (testId: string, newInstruction: string) => void;
  onStepTextChange: (testId: string, stepId: string, newText: string) => void;
}

export const TestCaseCard: React.FC<TestCaseCardProps> = ({
  testCase,
  onRunTest,
  onEditTest,
  onStepClick,
  onInstructionChange,
  onStepTextChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingStep, setEditingStep] = useState<ActionStep | null>(null);
  const [collapsedSteps, setCollapsedSteps] = useState<Set<string>>(new Set());
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stepsRef.current) {
      if (isExpanded) {
        gsap.to(stepsRef.current, {
          height: 'auto',
          opacity: 1,
          duration: 0.3,
          ease: 'power2.out',
        });
      } else {
        gsap.to(stepsRef.current, {
          height: 0,
          opacity: 0,
          duration: 0.25,
          ease: 'power2.in',
        });
      }
    }
  }, [isExpanded]);

  const handleEditStep = (step: ActionStep) => {
    if (collapsedSteps.has(step.id)) {
      setCollapsedSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(step.id);
        return newSet;
      });
    }
    
    setEditingStep(step);
  };

  const handleSaveStep = (updatedText: string) => {
    if (editingStep) {
      onStepTextChange(testCase.id, editingStep.id, updatedText);
      setEditingStep(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingStep(null);
  };

  const toggleStepCollapse = (stepId: string) => {
    setCollapsedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const getPreviewText = (text: string) => {
    const words = text.split(' ');
    if (words.length <= 5) return text;
    return words.slice(0, 5).join(' ') + '…';
  };

  const getStatusIcon = () => {
    switch (testCase.status) {
      case 'idle':
        return <Circle className="w-5 h-5 text-idle" strokeWidth={2} />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" strokeWidth={2} />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-success" strokeWidth={2} />;
      case 'failure':
        return <XCircle className="w-5 h-5 text-failure" strokeWidth={2} />;
    }
  };

  return (
    <Card className="bg-card border border-border rounded-lg p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0" aria-label={`Test status: ${testCase.status}`}>
          {getStatusIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-body-lg font-body font-semibold text-foreground truncate">
            {testCase.name}
          </h3>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            onClick={() => onRunTest(testCase.id)}
            variant="ghost"
            size="icon"
            className="bg-transparent text-secondary hover:bg-secondary/10 hover:text-secondary h-8 w-8"
            aria-label="Re-run test"
          >
            <RotateCw className="w-4 h-4" strokeWidth={1.5} />
          </Button>
          
          <Button
            onClick={() => onEditTest(testCase)}
            variant="ghost"
            size="icon"
            className="bg-transparent text-foreground hover:bg-muted hover:text-foreground h-8 w-8"
            aria-label="Edit test"
          >
            <Pencil className="w-4 h-4" strokeWidth={1.5} />
          </Button>
          
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            size="icon"
            className="bg-transparent text-foreground hover:bg-muted hover:text-foreground h-8 w-8"
            aria-label={isExpanded ? 'Collapse steps' : 'Expand steps'}
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" strokeWidth={1.5} />
            ) : (
              <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
            )}
          </Button>
        </div>
      </div>
      
      <div
        ref={stepsRef}
        className="overflow-hidden"
        style={{ height: 0, opacity: 0 }}
      >
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          {testCase.steps.map((step) => (
            <div
              key={step.id}
              className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors duration-200 ease-in-out cursor-pointer group"
              onClick={() => onStepClick(step, testCase)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onStepClick(step, testCase);
                }
              }}
            >
              <span className="text-body-md font-body font-medium text-muted-foreground flex-shrink-0">
                {step.number}.
              </span>
              
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded flex items-center justify-center ${
                  step.screenshot ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <Camera className={`w-4 h-4 ${
                    step.screenshot ? 'text-primary' : 'text-muted-foreground'
                  }`} strokeWidth={1.5} />
                </div>
              </div>
              
              <span className="flex-1 text-body-md font-body text-foreground min-w-0">
                {collapsedSteps.has(step.id) ? getPreviewText(step.text) : step.text}
              </span>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStepCollapse(step.id);
                  }}
                  variant="ghost"
                  size="icon"
                  className="bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground h-8 w-8"
                  aria-label={collapsedSteps.has(step.id) ? 'Expand step text' : 'Collapse step text'}
                >
                  <ChevronsUpDown className="w-4 h-4" strokeWidth={1.5} />
                </Button>
                
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditStep(step);
                  }}
                  variant="ghost"
                  size="icon"
                  className="bg-transparent text-foreground hover:bg-muted hover:text-foreground h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Edit step"
                >
                  <Pencil className="w-3 h-3" strokeWidth={1.5} />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {editingStep && (
          <EditStepModal
            step={editingStep}
            onSave={handleSaveStep}
            onCancel={handleCancelEdit}
          />
        )}
      </div>
    </Card>
  );
};
