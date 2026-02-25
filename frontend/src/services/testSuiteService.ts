import api from "@/lib/api";
import { TestSuiteDTO, TestSuite } from "@/types/test-suit";
import { mapTestSuiteToViewModel } from "@/utils/mappers";

export const testSuiteService = {
    getTestSuites: async (projectId: string): Promise<TestSuite[]> => {
        try {
            const response = await api.get<TestSuiteDTO[]>(`/projects/${projectId}/test-suites`);
            return response.data.map(mapTestSuiteToViewModel);
        } catch (error) {
            console.error(`Service error (getTestSuites ${projectId}):`, error);
            throw error;
        }
    },
    createTestSuite: async (projectId: string, data: { name: string; description: string }): Promise<TestSuite> => {
        try {
            const response = await api.post<TestSuiteDTO>(`/projects/${projectId}/test-suites`, data);
            return mapTestSuiteToViewModel(response.data);
        } catch (error) {
            console.error('Service error (createTestSuite):', error);
            throw error;
        }
    },
    updateTestSuite: async (suiteId: string, data: { name: string; description: string }): Promise<TestSuite> => {
        try {
            const response = await api.put<TestSuiteDTO>(`/test-suites/${suiteId}`, data);
            return mapTestSuiteToViewModel(response.data);
        } catch (error) {
            console.error(`Service error (updateTestSuite ${suiteId}):`, error);
            throw error;
        }
    },
    deleteTestSuite: async (suiteId: string) => {
        try {
            await api.delete(`/test-suites/${suiteId}`);
        } catch (error) {
            console.error(`Service error (deleteTestSuite ${suiteId}):`, error);
            throw error;
        }
    }
};
