import React, { useState } from 'react';
import { Plus, Play, Layers, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TestCaseCard } from './TestCaseCard';
import { TestCase, ActionStep } from '@/types/test-case';
import { motion, AnimatePresence } from 'framer-motion';

export interface SuiteWithCases {
  id: string;
  name: string;
  testCases: TestCase[];
}

interface TestSuiteManagerProps {
  testCases?: TestCase[];
  suites?: SuiteWithCases[];
  onAddTestCase: () => void;
  onRunAllTests: () => void;
  onAbortRun?: () => void;
  isRunning?: boolean;
  isAborting?: boolean;
  onRunSingleTest: (testId: string) => void;
  onEditTestCase: (testCase: TestCase) => void;
  onStepClick: (step: ActionStep, testCase: TestCase) => void;
  onStepDetailsClick?: (step: ActionStep) => void;
  onInstructionChange: (testId: string, newInstruction: string) => void;
  onStepTextChange: (testId: string, stepId: string, newText: string) => void;
  isReadOnly?: boolean;
  header?: React.ReactNode;
}

const TestSuiteCard: React.FC<{
  suite: SuiteWithCases;
  onRunSingleTest: (testId: string) => void;
  onEditTestCase: (testCase: TestCase) => void;
  onStepClick: (step: ActionStep, testCase: TestCase) => void;
  onStepDetailsClick?: (step: ActionStep) => void;
  onInstructionChange: (testId: string, newInstruction: string) => void;
  onStepTextChange: (testId: string, stepId: string, newText: string) => void;
  isReadOnly?: boolean;
}> = ({
  suite,
  onRunSingleTest,
  onEditTestCase,
  onStepClick,
  onStepDetailsClick,
  onInstructionChange,
  onStepTextChange,
  isReadOnly
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm transition-all hover:shadow-md">
        <div
          className="px-4 py-3 bg-gray-50/50 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{suite.name}</h3>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                {suite.testCases.length} Test Cases
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
            <motion.div
              animate={{ rotate: isExpanded ? 0 : -90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4" />
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
              <div className="p-4 space-y-4 bg-white border-t border-gray-50">
                {suite.testCases.map((testCase) => (
                  <TestCaseCard
                    key={testCase.id}
                    testCase={testCase}
                    onRunTest={onRunSingleTest}
                    onEditTest={onEditTestCase}
                    onStepClick={onStepClick}
                    onStepDetailsClick={onStepDetailsClick}
                    onInstructionChange={onInstructionChange}
                    onStepTextChange={onStepTextChange}
                    isReadOnly={isReadOnly}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

export const TestSuiteManager: React.FC<TestSuiteManagerProps> = ({
  testCases = [],
  suites,
  onAddTestCase,
  onRunAllTests,
  onAbortRun,
  isRunning,
  isAborting,
  onRunSingleTest,
  onEditTestCase,
  onStepClick,
  onStepDetailsClick,
  onInstructionChange,
  onStepTextChange,
  isReadOnly,
  header,
}) => {
  return (
    <aside className="w-full lg:w-[400px] xl:w-[450px] bg-white border-r border-border flex flex-col h-full overflow-hidden shadow-sm z-10">
      <div className="px-6 py-6 flex flex-col justify-center border-b border-border bg-white">
        <div className="flex items-center justify-between">
          {header ? header : (
            <h2 className="text-xl font-sans font-bold text-foreground">
              {isReadOnly ? 'Run Details' : 'Suite Manager'}
            </h2>
          )}
        </div>

        {!isReadOnly && (
          <div className="flex gap-3 mt-4">
            <Button
              onClick={onAddTestCase}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-body font-normal"
            >
              <Plus className="w-5 h-5 mr-2" strokeWidth={1.5} />
              Add Test Case
            </Button>

            <Button
              onClick={onRunAllTests}
              disabled={isRunning || isAborting}
              variant="ghost"
              className="bg-transparent text-gray-700 border border-gray-200 hover:bg-gray-100 hover:!text-gray-900 font-body font-normal"
            >
              <Play className="w-5 h-5 mr-2" strokeWidth={1.5} />
              {isRunning ? 'Running...' : 'Run All'}
            </Button>
            {(isRunning || isAborting) && onAbortRun && (
              <Button
                onClick={onAbortRun}
                disabled={isAborting}
                variant="destructive"
                className="font-body font-normal shadow-md"
              >
                {isAborting ? 'Aborting...' : 'Abort'}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {suites ? (
          suites.map((suite) => (
            <TestSuiteCard
              key={suite.id}
              suite={suite}
              onRunSingleTest={onRunSingleTest}
              onEditTestCase={onEditTestCase}
              onStepClick={onStepClick}
              onStepDetailsClick={onStepDetailsClick}
              onInstructionChange={onInstructionChange}
              onStepTextChange={onStepTextChange}
              isReadOnly={isReadOnly}
            />
          ))
        ) : (
          <div className="space-y-4">
            {testCases.map((testCase) => (
              <TestCaseCard
                key={testCase.id}
                testCase={testCase}
                onRunTest={onRunSingleTest}
                onEditTest={onEditTestCase}
                onStepClick={onStepClick}
                onStepDetailsClick={onStepDetailsClick}
                onInstructionChange={onInstructionChange}
                onStepTextChange={onStepTextChange}
                isReadOnly={isReadOnly}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
