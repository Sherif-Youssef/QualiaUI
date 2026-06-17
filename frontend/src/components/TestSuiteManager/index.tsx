import React, { useState } from 'react';
import { Layers, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TestCaseCard } from '../TestCaseCard';
import { TestCase, ActionStep } from "@/types";
import { motion, AnimatePresence } from 'framer-motion';

export interface SuiteWithCases {
  id: string;
  name: string;
  testCases: TestCase[];
}

interface TestSuiteManagerProps {
  testCases?: TestCase[];
  suites?: SuiteWithCases[];
  onStepClick: (step: ActionStep, testCase: TestCase) => void;
  onStepTextChange: (testId: string, stepId: string, newText: string) => void;
  selectedStepId?: string;
  isReadOnly?: boolean;
  header?: React.ReactNode;
}

const TestSuiteCard: React.FC<{
  suite: SuiteWithCases;
  onStepClick: (step: ActionStep, testCase: TestCase) => void;
  onStepTextChange: (testId: string, stepId: string, newText: string) => void;
  selectedStepId?: string;
  isReadOnly?: boolean;
}> = ({
  suite,
  onStepClick,
  onStepTextChange,
  selectedStepId,
  isReadOnly,
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
                    onStepClick={onStepClick}
                    onStepTextChange={onStepTextChange}
                    selectedStepId={selectedStepId}
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
  onStepClick,
  onStepTextChange,
  selectedStepId,
  isReadOnly,
  header,
}) => {
  return (
    <aside className="w-full lg:w-[400px] xl:w-[450px] bg-white border-r border-border flex flex-col h-full overflow-hidden shadow-sm z-10 text-left">
      <div className="px-6 py-6 flex flex-col gap-4 border-b border-border bg-white">
        <div className="flex flex-col gap-4">
          {header ? header : (
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-sans font-bold text-foreground truncate">
                {isReadOnly ? 'Run Details' : 'Suite Manager'}
              </h2>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {suites ? (
          suites.map((suite) => (
            <TestSuiteCard
              key={suite.id}
              suite={suite}
              onStepClick={onStepClick}
              onStepTextChange={onStepTextChange}
              selectedStepId={selectedStepId}
              isReadOnly={isReadOnly}
            />
          ))
        ) : (
          <div className="space-y-4">
            {testCases.map((testCase) => (
              <TestCaseCard
                key={testCase.id}
                testCase={testCase}
                onStepClick={onStepClick}
                onStepTextChange={onStepTextChange}
                selectedStepId={selectedStepId}
                isReadOnly={isReadOnly} />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
