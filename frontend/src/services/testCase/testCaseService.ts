import api, { ApiResponse } from "@/lib/api";
import { TestCaseDTO, TestCase } from "@/types/test-case";
import { mapTestCaseToViewModel } from "@/utils/mappers";

export const testCaseService = {
    getTestCases: async (projectId: string, suiteId: string, offset = 0, limit = 5, title?: string): Promise<{ testCases: TestCase[]; total: number }> => {
        try {
            const response = await api.get<ApiResponse<TestCaseDTO>>(
                `/projects/${projectId}/testsuites/${suiteId}/testcases`,
                { params: { offset, limit, title: title || undefined } }
            );
            return {
                testCases: response.data.items.map(mapTestCaseToViewModel),
                total: response.data.total_items
            };
        } catch (error) {
            console.error(`Service error (getTestCases suite ${suiteId}):`, error);
            throw error;
        }
    },

    getTestCaseById: async (projectId: string, suiteId: string, caseId: string): Promise<TestCase> => {
        try {
            const response = await api.get<TestCaseDTO>(
                `/projects/${projectId}/testsuites/${suiteId}/testcases/${caseId}`
            );
            return mapTestCaseToViewModel(response.data);
        } catch (error) {
            console.error(`Service error (getTestCaseById ${caseId}):`, error);
            throw error;
        }
    },

    createTestCase: async (projectId: string, suiteId: string, data: any): Promise<TestCase> => {
        try {
            const response = await api.post<TestCaseDTO>(
                `/projects/${projectId}/testsuites/${suiteId}/testcases`,
                data
            );
            return mapTestCaseToViewModel(response.data);
        } catch (error) {
            console.error('Service error (createTestCase):', error);
            throw error;
        }
    },

    updateTestCase: async (projectId: string, suiteId: string, caseId: string, data: any): Promise<TestCase> => {
        try {
            const response = await api.put<TestCaseDTO>(
                `/projects/${projectId}/testsuites/${suiteId}/testcases/${caseId}`,
                data
            );
            return mapTestCaseToViewModel(response.data);
        } catch (error) {
            console.error(`Service error (updateTestCase ${caseId}):`, error);
            throw error;
        }
    },

    deleteTestCase: async (projectId: string, suiteId: string, caseId: string) => {
        try {
            await api.delete(`/projects/${projectId}/testsuites/${suiteId}/testcases/${caseId}`);
        } catch (error) {
            console.error(`Service error (deleteTestCase ${caseId}):`, error);
            throw error;
        }
    }
};
