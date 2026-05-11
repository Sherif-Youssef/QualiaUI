import api, { ApiResponse, getDeduplicated } from "@/lib/api";
import { TestSuiteDTO, TestSuite } from "@/types/test-suit";
import { mapTestSuiteToViewModel } from "@/utils/mappers";

export const testSuiteService = {
    getTestSuites: async (projectId: string, offset = 0, limit = 10, name?: string): Promise<{ testSuites: TestSuite[]; total: number }> => {
        try {
            const response = await getDeduplicated<ApiResponse<TestSuiteDTO>>(
                `/projects/${projectId}/testsuites`,
                { offset, limit, name: name || undefined }
            );
            return {
                testSuites: response.data.items.map(mapTestSuiteToViewModel),
                total: response.data.total_items
            };
        } catch (error) {
            console.error(`Service error (getTestSuites ${projectId}):`, error);
            throw error;
        }
    },
    getTestSuiteById: async (projectId: string, suiteId: string): Promise<TestSuite> => {
        try {
            const response = await getDeduplicated<TestSuiteDTO>(
                `/projects/${projectId}/testsuites/${suiteId}`
            );
            return mapTestSuiteToViewModel(response.data);
        } catch (error) {
            console.error(`Service error (getTestSuiteById ${suiteId}):`, error);
            throw error;
        }
    },
    createTestSuite: async (projectId: string, data: { name: string; description: string }): Promise<TestSuite> => {
        try {
            const response = await api.post<TestSuiteDTO>(`/projects/${projectId}/testsuites`, data);
            return mapTestSuiteToViewModel(response.data);
        } catch (error) {
            console.error('Service error (createTestSuite):', error);
            throw error;
        }
    },
    updateTestSuite: async (projectId: string, suiteId: string, data: { name: string; description: string }): Promise<TestSuite> => {
        try {
            const response = await api.put<TestSuiteDTO>(`/projects/${projectId}/testsuites/${suiteId}`, data);
            return mapTestSuiteToViewModel(response.data);
        } catch (error) {
            console.error(`Service error (updateTestSuite ${suiteId}):`, error);
            throw error;
        }
    },
    deleteTestSuite: async (projectId: string, suiteId: string) => {
        try {
            await api.delete(`/projects/${projectId}/testsuites/${suiteId}`);
        } catch (error) {
            console.error(`Service error (deleteTestSuite ${suiteId}):`, error);
            throw error;
        }
    },
    addCookie: async (projectId: string, suiteId: string, cookie: any) => {
        try {
            const response = await api.post(`/projects/${projectId}/testsuites/${suiteId}/cookies`, cookie);
            return response.data;
        } catch (error) {
            console.error(`Service error (addTestSuiteCookie ${suiteId}):`, error);
            throw error;
        }
    },
    updateCookie: async (projectId: string, suiteId: string, cookieId: string | number, cookie: any) => {
        try {
            const response = await api.put(`/projects/${projectId}/testsuites/${suiteId}/cookies/${cookieId}`, cookie);
            return response.data;
        } catch (error) {
            console.error(`Service error (updateTestSuiteCookie ${cookieId}):`, error);
            throw error;
        }
    },
    deleteCookie: async (projectId: string, suiteId: string, cookieId: string | number) => {
        try {
            await api.delete(`/projects/${projectId}/testsuites/${suiteId}/cookies/${cookieId}`);
        } catch (error) {
            console.error(`Service error (deleteTestSuiteCookie ${cookieId}):`, error);
            throw error;
        }
    }
};
