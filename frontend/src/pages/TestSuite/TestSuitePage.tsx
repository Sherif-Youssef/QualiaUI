import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';
import { AddTestCaseModal } from '@/components/Modal/AddTestCaseModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmation';
import { TestCase } from '@/types';
import { saveTestCases, loadTestCases } from '@/utils/testCaseStorage';

// Assets
import AmazonScreenshot from '@/assets/Images/image.png'
import talabatScreenshot from '@/assets/Images/image2.png'

// Sub-components
import { TestSuiteLayout } from './TestSuiteLayout';
import { TestSuiteHeader } from './TestSuiteHeader';
import { TestCaseTable } from './TestCaseTable';

export const TestSuitePage: React.FC = () => {
    const navigate = useNavigate();
    const { projectId, suiteId } = useParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);
    const [runVersion, setRunVersion] = useState('v1.0');
    const [isRunningAll, setIsRunningAll] = useState(false);
    const itemsPerPage = 5;

    const defaultTestCases: TestCase[] = [
        {
            id: '2',
            suiteId: suiteId!,
            name: 'Login failure test',
            status: 'failed',
            runVersion: 'v1.0',
            createdAt: '2024-01-15',
            url: 'https://example.com/login',
            mode: 'plain',
            plainText: 'Try to login with incorrect password',
            executionSteps: [
                { id: '2-1', caseId: '2', number: 1, text: 'Navigate to the login page', screenshot: AmazonScreenshot, status: 'passed' },
                { id: '2-2', caseId: '2', number: 2, text: 'Enter valid email address', screenshot: talabatScreenshot, status: 'passed' },
                { id: '2-3', caseId: '2', number: 3, text: 'Enter invalid password', screenshot: AmazonScreenshot, status: 'failed' },
                { id: '2-4', caseId: '2', number: 4, text: 'Verify error message appears', screenshot: talabatScreenshot, status: 'passed' },
            ]
        },
        {
            id: '3',
            suiteId: suiteId!,
            name: 'Forgot password flow',
            status: 'idle',
            runVersion: 'v1.0',
            createdAt: '2024-01-16',
            url: 'https://example.com/forgot-password',
            mode: 'step-based',
            steps: [
                { id: 's1', type: 'do', description: 'Click forgot password link' },
                { id: 's2', type: 'do', description: 'Enter email address' },
                { id: 's3', type: 'check', description: 'Verify confirmation message' },
            ],
            executionSteps: [
                { id: '3-1', caseId: '3', number: 1, text: 'DO: Click forgot password link', screenshot: AmazonScreenshot, status: 'idle' },
                { id: '3-2', caseId: '3', number: 2, text: 'DO: Enter email address', screenshot: AmazonScreenshot, status: 'idle' },
                { id: '3-3', caseId: '3', number: 3, text: 'CHECK: Verify confirmation message', screenshot: AmazonScreenshot, status: 'idle' },
            ]
        }
    ];

    const [testCases, setTestCases] = useState<TestCase[]>(() => {
        const saved = loadTestCases();
        return saved || defaultTestCases;
    });

    useEffect(() => {
        saveTestCases(testCases);
    }, [testCases]);

    const filteredCases = testCases.filter(testCase =>
        testCase.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
    const paginatedCases = filteredCases.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleDeleteClick = (id: string, name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirmation({ id, name });
    };

    const confirmDelete = () => {
        if (deleteConfirmation) {
            setTestCases(testCases.filter(tc => tc.id !== deleteConfirmation.id));
            setDeleteConfirmation(null);
        }
    };

    const handleEditClick = (testCase: TestCase, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingTestCase(testCase);
        setIsModalOpen(true);
    };

    const handleRunAll = () => {
        setIsRunningAll(true);
        setTestCases(testCases.map(tc => ({ ...tc, status: 'running', runVersion })));

        setTimeout(() => {
            setTestCases(prev => prev.map(tc => ({
                ...tc,
                status: Math.random() > 0.3 ? 'passed' : 'failed',
                runVersion,
            })));
            setIsRunningAll(false);
        }, 2000);
    };

    const handleSaveTestCase = (data: any) => {
        if (editingTestCase) {
            setTestCases(testCases.map(tc =>
                tc.id === editingTestCase.id
                    ? {
                        ...tc,
                        ...data,
                        executionSteps: data.mode === 'step-based' && data.steps
                            ? data.steps.map((step: any, index: number) => ({
                                id: `${tc.id}-${index + 1}`,
                                caseId: tc.id,
                                number: index + 1,
                                text: `${step.type.toUpperCase()}: ${step.description}`,
                                screenshot: AmazonScreenshot,
                                status: 'idle' as const,
                            }))
                            : tc.executionSteps
                    }
                    : tc
            ));
        } else {
            const newCaseId = Date.now().toString();
            const newCase: TestCase = {
                id: newCaseId,
                suiteId: suiteId!,
                ...data,
                status: 'idle',
                runVersion,
                createdAt: new Date().toISOString().split('T')[0],
                executionSteps: data.mode === 'step-based' && data.steps
                    ? data.steps.map((step: any, index: number) => ({
                        id: `${newCaseId}-${index + 1}`,
                        caseId: newCaseId,
                        number: index + 1,
                        text: `${step.type.toUpperCase()}: ${step.description}`,
                        screenshot: AmazonScreenshot,
                        status: 'idle' as const,
                    }))
                    : [{
                        id: `${newCaseId}-1`,
                        caseId: newCaseId,
                        number: 1,
                        text: data.plainText || 'Test step',
                        screenshot: AmazonScreenshot,
                        status: 'idle' as const,
                    }],
            };
            setTestCases([...testCases, newCase]);
        }
        setIsModalOpen(false);
        setEditingTestCase(null);
    };

    return (
        <TestSuiteLayout
            header={
                <TestSuiteHeader
                    runVersion={runVersion}
                    setRunVersion={setRunVersion}
                    isRunningAll={isRunningAll}
                    onRunAll={handleRunAll}
                    onAddTestCase={() => { setEditingTestCase(null); setIsModalOpen(true); }}
                />
            }
            searchBar={
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search Test Case..."
                />
            }
            content={
                <>
                    <TestCaseTable
                        testCases={paginatedCases}
                        onNavigate={(caseId) => navigate(`/project/${projectId}/suite/${suiteId}/case/${caseId}`)}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                    />
                    {filteredCases.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                            <p className="text-gray-500 font-medium">No test cases match your search.</p>
                        </div>
                    )}
                </>
            }
            pagination={filteredCases.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredCases.length}
                    onPageChange={setCurrentPage}
                />
            )}
            modals={
                <>
                    <AddTestCaseModal
                        isOpen={isModalOpen}
                        onClose={() => {
                            setIsModalOpen(false);
                            setEditingTestCase(null);
                        }}
                        editingTestCase={editingTestCase}
                        onSave={handleSaveTestCase}
                    />

                    <DeleteConfirmationModal
                        isOpen={deleteConfirmation !== null}
                        onClose={() => setDeleteConfirmation(null)}
                        onConfirm={confirmDelete}
                        itemName={deleteConfirmation?.name || ""}
                    />
                </>
            }
        />
    );
};
