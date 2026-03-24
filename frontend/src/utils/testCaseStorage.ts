import { TestCase } from '../types';

const STORAGE_KEY = 'qualia_test_cases';

export const saveTestCases = (testCases: TestCase[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(testCases));
  } catch (error) {
    console.error('Failed to save test cases:', error);
  }
};

export const loadTestCases = (): TestCase[] | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load test cases:', error);
    return null;
  }
};

export const getTestCaseById = (caseId: string): TestCase | null => {
  const testCases = loadTestCases();
  if (!testCases) return null;
  return testCases.find(tc => tc.id === caseId) || null;
};
