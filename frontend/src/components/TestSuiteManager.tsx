import React from 'react';
import { Plus, Play } from 'lucide-react';
import { Button } from '../components/ui/button';
import { TestCaseCard } from './TestCaseCard';
import { TestCase, ActionStep } from '../types';

interface TestSuiteManagerProps {
  testCases: TestCase[];
  onAddTestCase: () => void;
  onRunAllTests: () => void;
  onRunSingleTest: (testId: string) => void;
  onEditTestCase: (testCase: TestCase) => void;
  onStepClick: (step: ActionStep, testCase: TestCase) => void;
  onInstructionChange: (testId: string, newInstruction: string) => void;
  onStepTextChange: (testId: string, stepId: string, newText: string) => void;
}

export const TestSuiteManager: React.FC<TestSuiteManagerProps> = ({
  testCases,
  onAddTestCase,
  onRunAllTests,
  onRunSingleTest,
  onEditTestCase,
  onStepClick,
  onInstructionChange,
  onStepTextChange,
}) => {
  return (
    <aside className="w-full lg:w-[35%] bg-gray-50 border-r border-border flex flex-col">
      <div className="p-6 border-b border-border bg-card">
        <h2 className="text-headline-md font-sans font-semibold text-foreground mb-5">
          Test Suite Manager
        </h2>
        
        <div className="flex gap-3">
          <Button
            onClick={onAddTestCase}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-body font-normal"
          >
            <Plus className="w-5 h-5 mr-2" strokeWidth={1.5} />
            Add Test Case
          </Button>
          
          <Button
            onClick={onRunAllTests}
            variant="outline"
            className="bg-transparent text-foreground border-border hover:bg-muted hover:text-foreground font-body font-normal"
          >
            <Play className="w-5 h-5 mr-2" strokeWidth={1.5} />
            Run All
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {testCases.map((testCase) => (
          <TestCaseCard
            key={testCase.id}
            testCase={testCase}
            onRunTest={onRunSingleTest}
            onEditTest={onEditTestCase}
            onStepClick={onStepClick}
            onInstructionChange={onInstructionChange}
            onStepTextChange={onStepTextChange}
          />
        ))}
      </div>
    </aside>
  );
};
