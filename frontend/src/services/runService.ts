import api, { ApiResponse } from "@/lib/api";
import {
    RunMode,
    Scope,
    StartRunResponse,
    ProjectRun,
    TestSuiteRun,
    TestCaseRun,
    TestStepRun
} from "@/types/run";

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
    },

    // --- Real-time Progress ---

    subscribeToRunProgress: (scope: Scope, runId: number, onMessage: (data: any) => void): EventSource => {
        const token = localStorage.getItem('token');
        const url = `/api/v1/runs/${scope.toLowerCase()}s/${runId}/stream${token ? `?token=${token}` : ''}`;
        const eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (err) {
                console.error("Error parsing SSE message:", err);
            }
        };

        eventSource.onerror = (err) => {
            console.error("SSE Connection Error:", err);
            eventSource.close();
        };

        return eventSource;
    }
};
