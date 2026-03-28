import React from 'react';
import { Plus, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TestCaseCard } from './TestCaseCard';
import { TestCase, ActionStep } from '@/types/test-case';

interface TestSuiteManagerProps {
  testCases: TestCase[];
  onAddTestCase: () => void;
  onRunAllTests: () => void;
  onRunSingleTest: (testId: string) => void;
  onEditTestCase: (testCase: TestCase) => void;
  onStepClick: (step: ActionStep, testCase: TestCase) => void;
  onInstructionChange: (testId: string, newInstruction: string) => void;
  onStepTextChange: (testId: string, stepId: string, newText: string) => void;
  isReadOnly?: boolean;
  header?: React.ReactNode;
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
  isReadOnly,
  header,
}) => {
  return (
    <aside className="w-full lg:w-[400px] xl:w-[450px] bg-white border-r border-border flex flex-col h-full overflow-hidden shadow-sm z-10">
      <div className={`px-6 flex flex-col justify-center border-b border-border bg-white ${isReadOnly ? 'py-6' : 'h-[100px]'}`}>
        {header ? header : (
          <>
            <h2 className="text-xl font-sans font-bold text-foreground">
              {isReadOnly ? 'Run Details' : 'Suite Manager'}
            </h2>
            
            {!isReadOnly && (
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
                  variant="ghost"
                  className="bg-transparent text-gray-700 border border-gray-200 hover:bg-gray-100 hover:!text-gray-900 font-body font-normal"
                >
                  <Play className="w-5 h-5 mr-2" strokeWidth={1.5} />
                  Run All
                </Button>
              </div>
            )}
          </>
        )}
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
            isReadOnly={isReadOnly}
          />
        ))}
      </div>
    </aside>
  );
};
