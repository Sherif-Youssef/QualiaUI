import api, { ApiResponse, getDeduplicated } from "@/lib/api";
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

    startTestCaseRun: async (testcaseId: number, mode: RunMode, model?: string): Promise<StartRunResponse> => {
        const response = await api.post<StartRunResponse>(`/runs/testcases`, {
            testcase_id: testcaseId,
            mode,
            model
        });
        return response.data;
    },

    startTestSuiteRun: async (testsuiteId: number, mode: RunMode, model?: string): Promise<StartRunResponse> => {
        const response = await api.post<StartRunResponse>(`/runs/testsuites`, {
            testsuite_id: testsuiteId,
            mode,
            model
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
    getProjectRunDetails: async (runId: number, force = false): Promise<ProjectRun & { testsuite_runs: TestSuiteRun[] }> => {
        try {
            const response = await getDeduplicated<ProjectRun & { testsuite_runs: TestSuiteRun[] }>(
                `/runs/projects/${runId}`,
                undefined,
                force
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getTestSuiteRunDetails: async (runId: number, force = false): Promise<TestSuiteRun & { testcase_runs: TestCaseRun[] }> => {
        try {
            const response = await getDeduplicated<TestSuiteRun & { testcase_runs: TestCaseRun[] }>(
                `/runs/testsuites/${runId}`,
                undefined,
                force
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getTestCaseRunDetails: async (runId: number, force = false): Promise<TestCaseRun & { teststep_runs: TestStepRun[] }> => {
        try {
            const response = await getDeduplicated<TestCaseRun & { teststep_runs: TestStepRun[] }>(
                `/runs/testcases/${runId}`,
                undefined,
                force
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    downloadTestSuiteReport: async (runId: number): Promise<void> => {
        const response = await api.get(`/runs/testsuites/${runId}/report`, {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `testsuite_run_${runId}_report.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },


    subscribeToRunProgress: (scope: Scope, runId: number, onMessage: (data: any) => void): EventSource => {
        const token = localStorage.getItem('token');
        const url = `/api/v1/runs/${scope.toLowerCase()}s/${runId}/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`;
        const eventSource = new EventSource(url);

        eventSource.onopen = () => {
            console.log(`[SSE] Connection established for ${scope} run ${runId}`);
        };

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
            // Don't close manually; let the browser attempt reconnection
        };

        return eventSource;
    }
};
