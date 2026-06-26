import { useState, useCallback } from 'react';
import { TestCase, ActionStep } from '@/types';
import { testCaseService } from '@/services/testCase/testCaseService';

interface UseTestCaseOperationsProps {
    projectId?: string;
    suiteId?: string;
    testCases: TestCase[];
    setTestCases: React.Dispatch<React.SetStateAction<TestCase[]>>;
    setError: (error: string | null) => void;
}

export const useTestCaseOperations = ({
    projectId,
    suiteId,
    testCases,
    setTestCases,
    setError,
}: UseTestCaseOperationsProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);

    const handleSaveTestCase = useCallback(async (data: any) => {
        if (!projectId || !suiteId) return;
        setModalLoading(true);
        setModalError(null);
        try {
            if (editingTestCase) {
                const updated = await testCaseService.updateTestCase(projectId, suiteId, editingTestCase.id, {
                    ...editingTestCase,
                    ...data
                });
                setTestCases(prev => prev.map(tc => tc.id === editingTestCase.id ? { ...tc, ...updated } : tc));
            } else {
                const newCase = await testCaseService.createTestCase(projectId, suiteId, data);
                setTestCases(prev => [...prev, newCase]);
            }
            setIsModalOpen(false);
            setEditingTestCase(null);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || `Failed to ${editingTestCase ? 'update' : 'create'} test case.`);
        } finally {
            setModalLoading(false);
        }
    }, [projectId, suiteId, editingTestCase]);

    const handleInstructionChange = useCallback(async (testId: string, newInstruction: string) => {
        if (!projectId) return;
        try {
            const tc = testCases.find(t => t.id === testId);
            if (!tc) return;
            const sId = suiteId || tc.suiteId;
            if (!sId) return;

            await testCaseService.updateTestCase(projectId, sId, testId, {
                ...tc,
                prompt: newInstruction,
                plainText: newInstruction
            });

            setTestCases(prev => prev.map(tc =>
                tc.id === testId ? { ...tc, prompt: newInstruction, plainText: newInstruction } : tc
            ));
        } catch (err) {
            console.error("Failed to update instruction:", err);
            setError("Failed to update instruction.");
        }
    }, [projectId, suiteId, testCases]);

    const handleStepTextChange = useCallback(async (testId: string, stepId: string, newText: string) => {
        if (!projectId) return;
        try {
            const testCase = testCases.find(tc => tc.id === testId);
            if (!testCase) return;
            const sId = suiteId || testCase.suiteId;
            if (!sId) return;

            const updatedSteps = (testCase.steps || []).map(s => s.id === stepId ? { ...s, text: newText } : s);

            await testCaseService.updateTestCase(projectId, sId, testId, {
                ...testCase,
                steps: updatedSteps
            });

            setTestCases(prev => prev.map(tc => tc.id === testId ? { ...tc, steps: updatedSteps as ActionStep[] } : tc));
        } catch (err) {
            console.error("Failed to update step text:", err);
            setError("Failed to update step text.");
        }
    }, [projectId, suiteId, testCases]);

    return {
        isModalOpen, setIsModalOpen,
        modalLoading,
        modalError, setModalError,
        editingTestCase, setEditingTestCase,
        handleSaveTestCase,
        handleInstructionChange,
        handleStepTextChange,
    };
};
