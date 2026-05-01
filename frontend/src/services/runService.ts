import api, { ApiResponse } from "@/lib/api";

export type RunStatus = 'QUEUED' | 'RUNNING' | 'PASSED' | 'FAILED' | 'ERROR' | 'ABORTED';
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
    llm_action: string | null;
    error_message: string | null;
    status: 'PASSED' | 'FAILED' | 'ERROR';
}

export interface StartRunResponse {
    scope: string;
    run_id: number;
    mode: RunMode;
    status: RunStatus;
    created_at: string;
}

export const runService = {
    // --- Starting Runs ---
    
    startTestCaseRun: async (testcaseId: number, mode: RunMode): Promise<StartRunResponse> => {
        const response = await api.post<StartRunResponse>(`/runs/testcases`, {
            testcase_id: testcaseId,
            mode
        });
        return response.data;
    },

    startTestSuiteRun: async (testsuiteId: number, mode: RunMode): Promise<StartRunResponse> => {
        const response = await api.post<StartRunResponse>(`/runs/testsuites`, {
            testsuite_id: testsuiteId,
            mode
        });
        return response.data;
    },

    startProjectRun: async (projectId: number, mode: RunMode): Promise<StartRunResponse> => {
        const response = await api.post<StartRunResponse>(`/runs/projects`, {
            project_id: projectId,
            mode
        });
        return response.data;
    },

    // --- Aborting Runs ---

    abortTestCaseRun: async (runId: number): Promise<void> => {
        await api.post(`/runs/testcases/${runId}/abort`);
    },

    abortTestSuiteRun: async (runId: number): Promise<void> => {
        await api.post(`/runs/testsuites/${runId}/abort`);
    },

    abortProjectRun: async (runId: number): Promise<void> => {
        await api.post(`/runs/projects/${runId}/abort`);
    },

    // --- Deleting Runs ---

    deleteTestCaseRun: async (runId: number): Promise<void> => {
        await api.delete(`/runs/testcases/${runId}`);
    },

    deleteTestSuiteRun: async (runId: number): Promise<void> => {
        await api.delete(`/runs/testsuites/${runId}`);
    },

    deleteProjectRun: async (runId: number): Promise<void> => {
        await api.delete(`/runs/projects/${runId}`);
    },

    // --- Run History Listing ---

    getProjectRuns: async (projectId: string | number, offset = 0, limit = 10): Promise<{ runs: ProjectRun[]; total: number }> => {
        const response = await api.get<ApiResponse<ProjectRun>>(`/projects/${projectId}/runs`, {
            params: { offset, limit }
        });
        return {
            runs: response.data.items,
            total: response.data.total_items
        };
    },

    getTestSuiteRuns: async (projectId: string | number, testsuiteId: string | number, offset = 0, limit = 10): Promise<{ runs: TestSuiteRun[]; total: number }> => {
        const response = await api.get<ApiResponse<TestSuiteRun>>(`/projects/${projectId}/testsuites/${testsuiteId}/runs`, {
            params: { offset, limit }
        });
        return {
            runs: response.data.items,
            total: response.data.total_items
        };
    },

    getTestCaseRuns: async (projectId: string | number, testsuiteId: string | number, testcaseId: string | number, offset = 0, limit = 10): Promise<{ runs: TestCaseRun[]; total: number }> => {
        const response = await api.get<ApiResponse<TestCaseRun>>(`/projects/${projectId}/testsuites/${testsuiteId}/testcases/${testcaseId}/runs`, {
            params: { offset, limit }
        });
        return {
            runs: response.data.items,
            total: response.data.total_items
        };
    },

    // --- Run Details ---

    getProjectRunDetails: async (runId: number): Promise<ProjectRun & { testsuite_runs: TestSuiteRun[] }> => {
        const response = await api.get<ProjectRun & { testsuite_runs: TestSuiteRun[] }>(`/runs/projects/${runId}`);
        return response.data;
    },

    getTestSuiteRunDetails: async (runId: number): Promise<TestSuiteRun & { testcase_runs: TestCaseRun[] }> => {
        const response = await api.get<TestSuiteRun & { testcase_runs: TestCaseRun[] }>(`/runs/testsuites/${runId}`);
        return response.data;
    },

    getTestCaseRunDetails: async (runId: number): Promise<TestCaseRun & { teststep_runs: TestStepRun[] }> => {
        const response = await api.get<TestCaseRun & { teststep_runs: TestStepRun[] }>(`/runs/testcases/${runId}`);
        return response.data;
    }
};
