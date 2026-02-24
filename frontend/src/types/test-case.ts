export type TestStatus = 'idle' | 'running' | 'passed' | 'failed' | 'success' | 'failure';

export interface TestCase {
    id: string;
    suiteId?: string;
    name: string;
    url: string;
    mode?: 'plain' | 'step-based';
    plainText?: string;
    prompt?: string;
    steps?: (TestCaseStep | ActionStep)[];
    executionSteps?: TestStep[];
    status: TestStatus;
    runVersion?: string;
    createdAt?: string;
}

export interface TestCaseStep {
    id: string;
    type: 'do' | 'check' | 'wait';
    description: string;
    text?: string;
}

export interface TestStep {
    id: string;
    caseId: string;
    number: number;
    text: string;
    screenshot?: string;
    status?: TestStatus;
}

export interface ActionStep {
    id: string;
    number: number;
    text: string;
    description?: string;
    screenshot?: string;
    type?: 'do' | 'check' | 'wait';
}
