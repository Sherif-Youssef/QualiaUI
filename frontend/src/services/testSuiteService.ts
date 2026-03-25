import api, { ApiResponse } from "@/lib/api";
import { TestSuiteDTO, TestSuite } from "@/types/test-suit";
import { mapTestSuiteToViewModel } from "@/utils/mappers";

export const testSuiteService = {
    getTestSuites: async (projectId: string): Promise<TestSuite[]> => {
        try {
            const response = await api.get<ApiResponse<TestSuiteDTO>>(`/projects/${projectId}/testsuites`);
            return response.data.items.map(mapTestSuiteToViewModel);
        } catch (error) {
            console.error(`Service error (getTestSuites ${projectId}):`, error);
            throw error;
        }
    },
    getTestSuiteById: async (projectId: string, suiteId: string): Promise<TestSuite> => {
        try {
            const response = await api.get<TestSuiteDTO>(`/projects/${projectId}/testsuites/${suiteId}`);
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
    }
};
