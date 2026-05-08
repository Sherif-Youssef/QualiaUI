import api, { ApiResponse, getDeduplicated } from "@/lib/api";
import { TestCaseDTO, TestCase } from "@/types/test-case";
import { testSuiteService } from "../testSuit/testSuiteService";
import { mapTestCaseToViewModel } from "@/utils/mappers";

export const testCaseService = {
    getTestCases: async (projectId: string, suiteId: string, offset = 0, limit = 5, name?: string): Promise<{ testCases: TestCase[]; total: number }> => {
        try {
            const response = await getDeduplicated<ApiResponse<TestCaseDTO>>(
                `/projects/${projectId}/testsuites/${suiteId}/testcases`,
                { offset, limit, name: name || undefined }
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
            const response = await getDeduplicated<TestCaseDTO>(
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
            const payload = {
                name: data.name,
                description: data.description || '',
                preconditions: data.preconditions || '',
                objectives: data.objectives || '',
                base_url: data.url || '',
                instruction: data.prompt || data.plainText || '',
                executable_steps: data.steps || null
            };
            const response = await api.post<TestCaseDTO>(
                `/projects/${projectId}/testsuites/${suiteId}/testcases`,
                payload
            );
            return mapTestCaseToViewModel(response.data);
        } catch (error) {
            console.error('Service error (createTestCase):', error);
            throw error;
        }
    },

    updateTestCase: async (projectId: string, suiteId: string, caseId: string, data: any): Promise<TestCase> => {
        try {
            const payload = {
                name: data.name,
                description: data.description,
                preconditions: data.preconditions,
                objectives: data.objectives,
                base_url: data.url,
                instruction: data.plainText !== undefined ? data.plainText : (data.prompt || ''),
                executable_steps: data.steps
            };
            const response = await api.put<TestCaseDTO>(
                `/projects/${projectId}/testsuites/${suiteId}/testcases/${caseId}`,
                payload
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
    },

    getAllProjectTestCases: async (projectId: string): Promise<TestCase[]> => {
        try {
            // Limit must be <= 100 per backend PaginationParams
            const suitesRes = await testSuiteService.getTestSuites(projectId, 0, 100);
            const allCases: TestCase[] = [];

            for (const suite of suitesRes.testSuites) {
                const casesRes = await testCaseService.getTestCases(projectId, suite.id, 0, 100);
                allCases.push(...casesRes.testCases.map(tc => ({ ...tc, suiteId: suite.id, suiteName: suite.name })));
            }

            return allCases;
        } catch (error: any) {
            console.error('Service error (getAllProjectTestCases):', error);
            // Extract meaningful error message from 422 validation errors
            if (error.response?.status === 422) {
                const detail = error.response.data.detail;
                const message = Array.isArray(detail)
                    ? detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join(', ')
                    : typeof detail === 'string' ? detail : 'Validation Error';
                throw new Error(message);
            }
            throw error;
        }
    }
};
