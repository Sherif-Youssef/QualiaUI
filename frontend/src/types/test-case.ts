export type TestStatus = 'idle' | 'running' | 'passed' | 'failed' | 'success' | 'failure';

export interface TestCaseDTO {
    id: number | string;
    testsuite_id: number | string;
    name: string;
    description: string;
    base_url: string;
    instruction: string;
    executable_steps?: any[];
    status?: TestStatus;
    run_version?: string;
    created_at?: string;
}

export interface TestCase {
    id: string;
    suiteId: string;
    suiteName?: string;
    name: string;
    description?: string;
    url: string;
    mode: 'plain' | 'step-based';
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
    status?: TestStatus;
}
