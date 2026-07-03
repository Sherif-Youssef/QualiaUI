import api, { ApiResponse, getDeduplicated } from "@/lib/api";
import { TestCaseDTO, TestCase } from "@/types";
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

    getTestCaseById: async (projectId: string, suiteId: string, caseId: string, force = false): Promise<TestCase> => {
        try {
            const response = await getDeduplicated<TestCaseDTO>(
                `/projects/${projectId}/testsuites/${suiteId}/testcases/${caseId}`,
                undefined,
                force
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

    addCookie: async (projectId: string, suiteId: string, caseId: string, cookie: any) => {
        try {
            const response = await api.post(`/projects/${projectId}/testsuites/${suiteId}/testcases/${caseId}/cookies`, cookie);
            return response.data;
        } catch (error) {
            console.error(`Service error (addTestCaseCookie ${caseId}):`, error);
            throw error;
        }
    },

    updateCookie: async (projectId: string, suiteId: string, caseId: string, cookieId: string | number, cookie: any) => {
        try {
            const response = await api.put(`/projects/${projectId}/testsuites/${suiteId}/testcases/${caseId}/cookies/${cookieId}`, cookie);
            return response.data;
        } catch (error) {
            console.error(`Service error (updateTestCaseCookie ${cookieId}):`, error);
            throw error;
        }
    },

    deleteCookie: async (projectId: string, suiteId: string, caseId: string, cookieId: string | number) => {
        try {
            await api.delete(`/projects/${projectId}/testsuites/${suiteId}/testcases/${caseId}/cookies/${cookieId}`);
        } catch (error) {
            console.error(`Service error (deleteTestCaseCookie ${cookieId}):`, error);
            throw error;
        }
    }
};
