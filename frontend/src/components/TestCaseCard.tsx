import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TestCase, ActionStep } from "@/types";
import { EditStepModal } from './Modal/EditStepModal';
import { ExpandableStepText } from './ExpandableStepText';

interface TestCaseCardProps {
  testCase: TestCase;
  onStepClick: (step: ActionStep, testCase: TestCase) => void;
  onStepTextChange: (testId: string, stepId: string, newText: string) => void;
  isReadOnly?: boolean;
  selectedStepId?: string;
}

const TestCaseStep: React.FC<{
  step: ActionStep;
  testCase: TestCase;
  onStepClick: (step: ActionStep, testCase: TestCase) => void;
  isReadOnly?: boolean;
  onEditStep: (step: ActionStep) => void;
  index: number;
  isActive?: boolean;
}> = ({ step, testCase, onStepClick, isReadOnly, onEditStep, index, isActive }) => {
  return (
    <div
      className={`group relative p-4 rounded-3xl border transition-all duration-300 cursor-pointer overflow-hidden ${isActive
        ? 'bg-white border-primary/40 shadow-[0_8px_30px_-10px_rgba(var(--primary-rgb),0.15)] ring-1 ring-primary/10'
        : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md'
        }`}
      onClick={() => onStepClick(step, testCase)}
    >
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div
            className={`w-10 h-10 rounded-2xl text-xs font-black flex items-center justify-center transition-all duration-300 ${isActive
              ? 'bg-primary text-white shadow-lg shadow-primary/30'
              : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'
              }`}
          >
            {index + 1}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <ExpandableStepText
                text={step.text || (step as any).description || 'Action Step'}
                className="text-sm font-bold text-gray-800 leading-relaxed"
              />
            </div>

            {!isReadOnly && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditStep(step);
                }}
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          <div className="flex items-center justify-start">
            <div className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm border ${(step.status === 'passed' || step.status === 'success') ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100' :
              (step.status === 'failed' || step.status === 'failure' || step.status === 'error') ? 'bg-rose-50/50 text-rose-600 border-rose-100' :
                step.status === 'aborted' ? 'bg-slate-50/50 text-slate-600 border-slate-100' :
                  'bg-blue-50/50 text-blue-600 border-blue-100'
              }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${(step.status === 'passed' || step.status === 'success') ? 'bg-emerald-500' :
                (step.status === 'failed' || step.status === 'failure' || step.status === 'error') ? 'bg-rose-500' :
                  step.status === 'aborted' ? 'bg-slate-400' :
                    'bg-blue-500 animate-pulse'
                }`} />
              <span className="text-[9px] font-black uppercase tracking-[0.1em]">
                {(step.status === 'success' || step.status === 'passed') ? 'Passed' :
                  (step.status === 'failure' || step.status === 'failed') ? 'Failed' :
                    step.status === 'error' ? 'Error' :
                      step.status === 'aborted' ? 'Aborted' :
                        step.status || 'Running'}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div
        className={`absolute top-0 left-0 w-1.5 h-full bg-primary transition-all duration-500 ${isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'
          } origin-center`}
      />
    </div>
  );
};

export const TestCaseCard: React.FC<TestCaseCardProps> = ({
  testCase,
  onStepClick,
  onStepTextChange,
  isReadOnly,
  selectedStepId,
}) => {
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

  return (
    <div className="space-y-4 group/card">
      <div className="space-y-4">
        {testCase.steps?.map((step: any, idx: number) => {
          const isActive = selectedStepId === String(step.id);
          return (
            <TestCaseStep
              key={step.id}
              step={step as ActionStep}
              testCase={testCase}
              onStepClick={onStepClick}
              isReadOnly={isReadOnly}
              onEditStep={handleEditStep}
              index={idx}
              isActive={isActive}
            />
          );
        })}

        {(!testCase.steps || testCase.steps.length === 0) && (
          <div className="py-12 text-center border-2 border-dashed border-gray-50 rounded-[2.5rem] bg-gray-50/20">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Steps show up here</p>
          </div>
        )}
      </div>

      {editingStep && (
        <EditStepModal
          step={{
            ...editingStep,
            text: editingStep.text || editingStep.description || ''
          }}
          onSave={handleSaveStep}
          onCancel={handleCancelEdit}
        />
      )}
    </div>
  );
};
