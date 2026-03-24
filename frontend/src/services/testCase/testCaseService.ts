import api from "@/lib/api";
import { TestCaseDTO, TestCase } from "@/types/test-case";
import { mapTestCaseToViewModel } from "@/utils/mappers";

export const testCaseService = {
    getTestCases: async (suiteId: string): Promise<TestCase[]> => {
        try {
            const response = await api.get<TestCaseDTO[]>(`/test-suites/${suiteId}/test-cases`);
            return response.data.map(mapTestCaseToViewModel);
        } catch (error) {
            console.error(`Service error (getTestCases ${suiteId}):`, error);
            throw error;
        }
    },
    getTestCaseById: async (caseId: string): Promise<TestCase> => {
        try {
            const response = await api.get<TestCaseDTO>(`/test-cases/${caseId}`);
            return mapTestCaseToViewModel(response.data);
        } catch (error) {
            console.error(`Service error (getTestCaseById ${caseId}):`, error);
            throw error;
        }
    },
    createTestCase: async (suiteId: string, data: any): Promise<TestCase> => {
        try {
            const response = await api.post<TestCaseDTO>(`/test-suites/${suiteId}/test-cases`, data);
            return mapTestCaseToViewModel(response.data);
        } catch (error) {
            console.error('Service error (createTestCase):', error);
            throw error;
        }
    },
    updateTestCase: async (caseId: string, data: any): Promise<TestCase> => {
        try {
            const response = await api.put<TestCaseDTO>(`/test-cases/${caseId}`, data);
            return mapTestCaseToViewModel(response.data);
        } catch (error) {
            console.error(`Service error (updateTestCase ${caseId}):`, error);
            throw error;
        }
    },
    deleteTestCase: async (caseId: string) => {
        try {
            await api.delete(`/test-cases/${caseId}`);
        } catch (error) {
            console.error(`Service error (deleteTestCase ${caseId}):`, error);
            throw error;
        }
    }
};
