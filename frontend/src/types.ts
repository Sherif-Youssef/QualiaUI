export type TestStatus = 'idle' | 'running' | 'success' | 'failure';

export type StepType = 'do' | 'check' | 'wait';

export interface ActionStep {
  id: string;
  number: number;
  text: string;
  screenshot?: string;
  type?: StepType;
}

export interface TestCase {
  id: string;
  name: string;
  url: string;
  prompt: string;       
  status: TestStatus;
  steps: ActionStep[];
}

