import { UserDTO } from './user';

export type RunStatus = 'QUEUED' | 'RUNNING' | 'PASSED' | 'FAILED' | 'ERROR' | 'ABORTED' | 'EXECUTED';
export type RunMode = 'NATURAL' | 'EXECUTABLE';
export type Scope = 'PROJECT' | 'TESTSUITE' | 'TESTCASE';

export interface BaseRun {
    id: number;
    scope: Scope;
    created_at: string;
    started_at: string | null;
    finished_at: string | null;
    job_uid: string;
    mode: RunMode;
    status: RunStatus;
    use_screenshots?: boolean;
    use_video?: boolean;
    timeout?: number;
    should_group_actions?: boolean;
    llm_model?: {
        id: number;
        model_name: string;
        display_name: string;
        provider: {
            id: number;
            display_name: string;
            provider_type: string;
        };
    };
    user?: UserDTO;
}

export interface ProjectRun extends BaseRun {
    project_id: number;
}

export interface TestSuiteRun extends BaseRun {
    testsuite_id: number;
    project_run_id: number | null;
    name?: string;
}

export interface TestCaseRun extends BaseRun {
    testcase_id: number;
    testsuite_run_id: number | null;
    base_url: string;
    instruction: string | null;
    termination_reason: string | null;
    name?: string;
}

export interface TestStepRun {
    id: number;
    testcase_run_id: number;
    executable: any | null;
    screenshot_before: string | null;
    screenshot_after: string | null;
    llm_action: any | null;
    intent: string | null;
    recreation_prompt: string | null;
    error_message: string | null;
    status: 'PASSED' | 'FAILED' | 'ERROR' | 'EXECUTED' | 'ABORTED';
}

export interface StartRunResponse {
    scope: string;
    run_id: number;
    mode: RunMode;
    status: RunStatus;
    created_at: string;
}

// Legacy types for compatibility (optional, can be phased out)
export type TestStatus = RunStatus;
export type TestRunMode = RunMode;
