import React, { useState } from 'react';
import { ChevronDown, RotateCw, Camera, Circle, CheckCircle2, XCircle, Loader2, Pencil, ChevronsUpDown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TestCase, ActionStep } from '@/types/test-case';
import { EditStepModal } from './Modal/EditStepModal';
import { motion, AnimatePresence } from 'framer-motion';

interface TestCaseCardProps {
  testCase: TestCase;
  onRunTest: (testId: string) => void;
  onEditTest: (testCase: TestCase) => void;
  onStepClick: (step: ActionStep, testCase: TestCase) => void;
  onStepDetailsClick?: (step: ActionStep) => void;
  onInstructionChange: (testId: string, newInstruction: string) => void;
  onStepTextChange: (testId: string, stepId: string, newText: string) => void;
  isReadOnly?: boolean;
}

export const TestCaseCard: React.FC<TestCaseCardProps> = ({
  testCase,
  onRunTest,
  onEditTest,
  onStepClick,
  onStepDetailsClick,
  onInstructionChange,
  onStepTextChange,
  isReadOnly
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingStep, setEditingStep] = useState<ActionStep | null>(null);

  const handleEditStep = (step: ActionStep) => {
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
      default:
        return <Circle className="w-5 h-5 text-idle" strokeWidth={2} />;
    }
  };

  return (
    <Card className="bg-card border border-border rounded-lg p-3 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0" aria-label={`Test status: ${testCase.status}`}>
          {getStatusIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-body-lg font-body font-semibold text-foreground truncate">
            {testCase.name}
          </h3>
          <div className="group/prompt relative">
            <p
              className={`text-body-sm font-body text-muted-foreground truncate italic ${!isReadOnly ? 'cursor-pointer hover:text-primary' : ''} transition-colors`}
              onClick={() => {
                if (isReadOnly) return;
                const newPrompt = prompt('Edit Instruction:', testCase.prompt || '');
                if (newPrompt !== null && newPrompt !== testCase.prompt) {
                  onInstructionChange(testCase.id, newPrompt);
                }
              }}
            >
              {testCase.prompt || 'No instruction set'}
            </p>
          </div>
          {testCase.status === 'failure' && testCase.description && (
            <p className="text-[11px] font-medium text-failure bg-failure/10 px-2 py-0.5 rounded-sm inline-block mt-0.5 max-w-full truncate" title={testCase.description}>
              {testCase.description}
            </p>
          )}
        </div>

        {!isReadOnly && (
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
          </div>
        )}

        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="ghost"
          size="icon"
          className="bg-transparent text-foreground hover:bg-muted hover:text-foreground h-8 w-8 flex-shrink-0"
          aria-label={isExpanded ? 'Collapse steps' : 'Expand steps'}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 0 : -90 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5" strokeWidth={1.5} />
          </motion.div>
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              {testCase.steps?.map((stepOrCase: any) => {
                // Ensure we have an ActionStep for the UI
                const step = stepOrCase as ActionStep;
                return (
                  <motion.div
                    key={step.id}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors duration-200 ease-in-out cursor-pointer group"
                    onClick={() => onStepClick(step, testCase)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onStepClick(step, testCase);
                      }
                    }}
                  >
                    <span className="text-body-md font-body font-medium text-muted-foreground flex-shrink-0">
                      {step.number || '•'}.
                    </span>

                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded flex items-center justify-center ${step.screenshot ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                        <Camera className={`w-4 h-4 ${step.screenshot ? 'text-primary' : 'text-muted-foreground'
                          }`} strokeWidth={1.5} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                      <span className="text-body-md font-body text-foreground truncate">
                        {step.text || (step as any).description || 'Action Step'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {step.description && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStepDetailsClick?.(step);
                          }}
                          variant="ghost"
                          size="icon"
                          className="bg-transparent text-primary/60 hover:bg-primary/5 hover:text-primary h-8 w-8"
                          aria-label="View description"
                        >
                          <Info className="w-4 h-4" strokeWidth={1.5} />
                        </Button>
                      )}

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStepDetailsClick?.(step);
                        }}
                        variant="ghost"
                        size="icon"
                        className="bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground h-8 w-8"
                        aria-label="View step details"
                      >
                        <ChevronsUpDown className="w-4 h-4" strokeWidth={1.5} />
                      </Button>

                      {!isReadOnly && (
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
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {editingStep && (
        <EditStepModal
          step={editingStep}
          onSave={handleSaveStep}
          onCancel={handleCancelEdit}
        />
      )}
    </Card>
  );
};
