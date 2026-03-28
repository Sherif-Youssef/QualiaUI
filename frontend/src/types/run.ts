export type TestStatus = 'PASSED' | 'FAILED' | 'ERROR' | 'ABORTED' | 'RUNNING' | 'PENDING' | 'UNKNOWN';
export type TestRunMode = 'NATURAL' | 'EXECUTABLE';
export type ActiveRunStatusEnum = 'PENDING' | 'RUNNING' | 'FINISHED';



export interface ActiveTestRun {
    run_id: string;
    indices: number[];
    name: string;
    llm_action?: string;
    description: string;
    mode: TestRunMode;
    started_at: string;
    finished_at?: string;
    status: ActiveRunStatusEnum;
}

export interface ActiveTestCaseRun {
    index: number;
    base_url: string;
    name: string;
    description: string;
    instruction?: string;
    started_at: string;
    finished_at?: string;
    status: ActiveRunStatusEnum;
}

export interface ActiveTestStepRun {
    index: number;
    executable?: any;
    screenshot_before?: string;
    screenshot_after?: string;
    started_at: string;
    finished_at: string;
    status: TestStatus;
}



export interface TestRunRead {
    id: string; 
    project_id: number;
    name: string;
    description: string;
    mode: TestRunMode;
    started_at: string;
    finished_at: string;
    status: TestStatus;
}

export interface TestCaseRunRead {
    id: number;
    testrun_id: number;
    base_url: string;
    name: string;
    description: string;
    instruction?: string;
    started_at: string;
    finished_at: string;
    status: TestStatus;
}

export interface TestStepRunRead {
    id: number;
    testcaserun_id: number;
    executable?: any;
    llm_action?: string;
    screenshot_before?: string;
    screenshot_after?: string;
    started_at: string;
    finished_at: string;
    status: TestStatus;
    error_message?: string;
}
