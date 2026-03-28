import api, { ApiResponse } from "@/lib/api";
import { TestRunRead, TestCaseRunRead, TestStepRunRead } from "@/types/run";
import { TestCase } from "@/types/test-case";
import { mapTestCaseRunToViewModel } from "@/utils/mappers";

export const runHistoryService = {
    getHistory: async (projectId: string, offset = 0, limit = 10): Promise<ApiResponse<TestRunRead>> => {
        try {
            const response = await api.get<ApiResponse<TestRunRead>>(
                `/projects/${projectId}/runs/history`, 
                { params: { offset, limit } }
            );
            return response.data;
        } catch (error) {
            console.error(`Failed to get run history for project ${projectId}:`, error);
            throw error;
        }
    },

    getRunResult: async (projectId: string, runUid: string): Promise<TestRunRead> => {
        try {
            const response = await api.get<TestRunRead>(`/projects/${projectId}/runs/history/${runUid}`);
            return response.data;
        } catch (error) {
            console.error(`Failed to get result for run ${runUid}:`, error);
            throw error;
        }
    },

    deleteRun: async (projectId: string, runUid: string): Promise<void> => {
        try {
            await api.delete(`/projects/${projectId}/runs/history/${runUid}`);
        } catch (error) {
            console.error(`Failed to delete run ${runUid}:`, error);
            throw error;
        }
    },

    getTestCaseRuns: async (projectId: string, runUid: string): Promise<ApiResponse<TestCaseRunRead>> => {
        try {
            const response = await api.get<ApiResponse<TestCaseRunRead>>(
                `/projects/${projectId}/runs/history/${runUid}/testcaseruns`
            );
            return response.data;
        } catch (error) {
            console.error(`Failed to get test case runs for ${runUid}:`, error);
            throw error;
        }
    },

    getTestCaseRun: async (projectId: string, runUid: string, testCaseRunId: number): Promise<TestCaseRunRead> => {
        try {
            const response = await api.get<TestCaseRunRead>(
                `/projects/${projectId}/runs/history/${runUid}/testcaseruns/${testCaseRunId}`
            );
            return response.data;
        } catch (error) {
            console.error(`Failed to get test case run details for ${testCaseRunId}:`, error);
            throw error;
        }
    },

    getTestStepRuns: async (projectId: string, runUid: string, testCaseRunId: number): Promise<ApiResponse<TestStepRunRead>> => {
        try {
            const response = await api.get<ApiResponse<TestStepRunRead>>(
                `/projects/${projectId}/runs/history/${runUid}/testcaseruns/${testCaseRunId}/teststepruns`
            );
            return response.data;
        } catch (error) {
            console.error(`Failed to get test step runs for ${testCaseRunId}:`, error);
            throw error;
        }
    },

    getTestStepRun: async (projectId: string, runUid: string, testCaseRunId: number, testStepRunId: number): Promise<TestStepRunRead> => {
        try {
            const response = await api.get<TestStepRunRead>(
                `/projects/${projectId}/runs/history/${runUid}/testcaseruns/${testCaseRunId}/teststepruns/${testStepRunId}`
            );
            return response.data;
        } catch (error) {
            console.error(`Failed to get test step run details for ${testStepRunId}:`, error);
            throw error;
        }
    },

    getRunFullDetails: async (projectId: string, runUid: string): Promise<{ run: TestRunRead, testCases: TestCase[] }> => {
        const run = await runHistoryService.getRunResult(projectId, runUid);
        const caseRunsData = await runHistoryService.getTestCaseRuns(projectId, runUid);
        
        const testCases: TestCase[] = await Promise.all(
            caseRunsData.items.map(async (cr) => {
                const stepsData = await runHistoryService.getTestStepRuns(projectId, runUid, cr.id);
                return mapTestCaseRunToViewModel(cr, stepsData.items);
            })
        );

        return { run, testCases };
    }
};