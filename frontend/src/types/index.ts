export interface Project
{
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface TestSuite {
  id: string;
  projectId: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface TestCase{
  id: string;
  suiteId: string;
  name: string;
  url: string;
  mode: 'plain' | 'step-based';
  plainText?: string;
  steps?: TestCaseStep[];
  executionSteps?: TestStep[];
  status: 'idle' | 'running' | 'passed' | 'failed';
  runVersion?: string;
  createdAt: string;
}

export interface TestCaseStep {
  id: string;
  type: 'do' | 'check' | 'wait';
  description: string;
}

export interface TestStep {
  id: string;
  caseId: string;
  number: number;
  text: string;
  screenshot?: string;
  status?: 'idle' | 'running' | 'passed' | 'failed';
}