import React, { useState } from 'react';
import { ChevronDown, Circle, CheckCircle2, XCircle, Loader2, Pencil, Play } from 'lucide-react';
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
  isRunning?: boolean;
}

const TestCaseStep: React.FC<{
  step: ActionStep;
  testCase: TestCase;
  onStepClick: (step: ActionStep, testCase: TestCase) => void;
  isReadOnly?: boolean;
  onEditStep: (step: ActionStep) => void;
}> = ({ step, testCase, onStepClick, isReadOnly, onEditStep }) => {
  const [isStepExpanded, setIsStepExpanded] = useState(false);

  return (
    <motion.div
      initial={{ x: -10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="flex flex-col gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-all duration-200 ease-in-out cursor-pointer group"
      onClick={() => onStepClick(step, testCase)}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center gap-3">
        <span className="text-body-md font-body font-bold text-primary flex-shrink-0 w-5">
          {step.number || '•'}
        </span>

        <div className="flex-1 min-w-0">
          <div className={`text-body-md font-body text-foreground leading-relaxed ${isStepExpanded ? '' : 'truncate block'}`}>
            {step.text || (step as any).description || 'Action Step'}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsStepExpanded(!isStepExpanded);
            }}
            className="text-[11px] text-primary/70 hover:text-primary mt-1 transition-colors"
          >
            {isStepExpanded ? 'Show less' : 'Show more'}
          </button>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 self-start mt-1">
          {!isReadOnly && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onEditStep(step);
              }}
              variant="ghost"
              size="icon"
              className="bg-transparent text-foreground hover:bg-muted hover:text-foreground h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Edit step"
            >
              <Pencil className="w-3 h-3" strokeWidth={1.5} />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const TestCaseCard: React.FC<TestCaseCardProps> = ({
  testCase,
  onEditTest,
  onStepClick,
  onInstructionChange,
  onStepTextChange,
  isReadOnly,
  isRunning,
  onRunTest
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
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
              {testCase.steps?.map((stepOrCase: any) => (
                <TestCaseStep
                  key={stepOrCase.id}
                  step={stepOrCase as ActionStep}
                  testCase={testCase}
                  onStepClick={onStepClick}
                  isReadOnly={isReadOnly}
                  onEditStep={handleEditStep}
                />
              ))}
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
