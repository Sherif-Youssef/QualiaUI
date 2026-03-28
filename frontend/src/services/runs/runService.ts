import api from "@/lib/api";
import { ActiveTestRun, ActiveTestCaseRun, ActiveTestStepRun, TestRunMode } from "@/types/run";

export const runService = {
    startRun: async (projectId: string, suiteId: string, mode: TestRunMode = 'NATURAL'): Promise<ActiveTestRun> => {
        try {
            const response = await api.post<ActiveTestRun>(
                `/projects/${projectId}/runs/active/new`,
                null,
                { params: { testsuite_id: suiteId, mode } }
            );
            return response.data;
        } catch (error) {
            console.error("Failed to start test run:", error);
            throw error;
        }
    },

    getRunStatus: async (projectId: string, runId: string): Promise<ActiveTestRun> => {
        try {
            const response = await api.get<ActiveTestRun>(`/projects/${projectId}/runs/active/${runId}/status`);
            return response.data;
        } catch (error) {
            console.error(`Failed to get run status for ${runId}:`, error);
            throw error;
        }
    },

    getTestCaseStatus: async (projectId: string, runId: string, index: number): Promise<ActiveTestCaseRun> => {
        try {
            const response = await api.get<ActiveTestCaseRun>(
                `/projects/${projectId}/runs/active/${runId}/testcases/${index}/status`
            );
            return response.data;
        } catch (error) {
            console.error(`Failed to get test case status for run ${runId} index ${index}:`, error);
            throw error;
        }
    },

    getTestCaseSteps: async (projectId: string, runId: string, index: number): Promise<ActiveTestStepRun[]> => {
        try {
            const response = await api.get<ActiveTestStepRun[]>(
                `/projects/${projectId}/runs/active/${runId}/testcases/${index}/steps`
            );
            return response.data;
        } catch (error) {
            console.error(`Failed to get test case steps for run ${runId} index ${index}:`, error);
            throw error;
        }
    },

    abortRun: async (projectId: string, runId: string): Promise<void> => {
        try {
            await api.delete(`/projects/${projectId}/runs/active/${runId}`);
        } catch (error) {
            console.error(`Failed to abort run ${runId}:`, error);
            throw error;
        }
    },

    getWebSocketUrl: (projectId: string, runId: string, testCaseIndex?: number): string => {
        const rawUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        const baseUrl = rawUrl.replace(/^https?:\/\//, '');

        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const path = testCaseIndex !== undefined
            ? `/projects/${projectId}/runs/active/${runId}/testcases/${testCaseIndex}/progress`
            : `/projects/${projectId}/runs/active/${runId}/progress`;

        return `${protocol}://${baseUrl}/api/v1${path}`;
    },

    subscribeToRun: (projectId: string, runId: string, onMessage: (data: ActiveTestStepRun) => void): WebSocket => {
        const url = runService.getWebSocketUrl(projectId, runId);
        const socket = new WebSocket(url);
        socket.onmessage = (event) => {
            try {
                const data: ActiveTestStepRun = JSON.parse(event.data);
                onMessage(data);
            } catch (err) {
                console.error("Error parsing run WebSocket message:", err);
            }
        };
        return socket;
    }
};
