import api, { ApiResponse, getDeduplicated } from "@/lib/api";
import {
    RunMode,
    Scope,
    StartRunResponse,
    ProjectRun,
    TestSuiteRun,
    TestCaseRun,
    TestStepRun
} from "@/types";

export const runService = {
    startTestCaseRun: async (
        testcaseId: number,
        mode: RunMode,
        llm_model_id?: number,
        use_screenshots = false,
        use_video = false,
        timeout = 60000,
        should_group_actions = false
    ): Promise<StartRunResponse> => {
        const response = await api.post<StartRunResponse>(`/runs/testcases`, {
            testcase_id: testcaseId,
            mode,
            llm_model_id,
            use_screenshots,
            use_video,
            timeout,
            should_group_actions
        });
        return response.data;
    },

    startTestSuiteRun: async (
        testsuiteId: number,
        mode: RunMode,
        llm_model_id?: number,
        use_screenshots = false,
        use_video = false,
        timeout = 60000,
        should_group_actions = false
    ): Promise<StartRunResponse> => {
        const response = await api.post<StartRunResponse>(`/runs/testsuites`, {
            testsuite_id: testsuiteId,
            mode,
            llm_model_id,
            use_screenshots,
            use_video,
            timeout,
            should_group_actions
        });
        return response.data;
    },





    abortTestCaseRun: async (runId: number): Promise<void> => {
        await api.post(`/runs/testcases/${runId}/abort`);
    },

    abortTestSuiteRun: async (runId: number): Promise<void> => {
        await api.post(`/runs/testsuites/${runId}/abort`);
    },





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


    subscribeToRunProgress: (
        scope: Scope, 
        runId: number, 
        onMessage: (data: any) => void,
        onError?: (err: Event) => void
    ): EventSource => {
        const token = localStorage.getItem('token');
        const url = `/api/v1/runs/${scope.toLowerCase()}s/${runId}/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`;
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
            if (onError) {
                onError(err);
            }
        };

        return eventSource;
    }
};
