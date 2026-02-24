import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Play, Trash2, Pencil, Circle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { TopNav } from '../components/TopNav';
import { SearchBar } from '../components/SearchBar';
import { Pagination } from '../components/Pagination';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AddTestCaseModal } from '../components/AddTestCaseModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmation';
import { TestCase } from '../types';
import { saveTestCases, loadTestCases } from '../utils/testCaseStorage';
import AmazonScreenshot from '../assets/Images/image.png'
import talabatScreenshot from '../assets/Images/image2.png'

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

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmation({ id, name });
  };

  const confirmDelete = () => {
    if (deleteConfirmation) {
      setTestCases(testCases.filter(tc => tc.id !== deleteConfirmation.id));
      setDeleteConfirmation(null);
    }
  };

  const handleEdit = (testCase: TestCase, e: React.MouseEvent) => {
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

  const getStatusIcon = (status: TestCase['status']) => {
    switch (status) {
      case 'idle': return <Circle className="w-5 h-5 text-gray-400" />;
      case 'running': return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case 'passed': return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'failed': return <XCircle className="w-5 h-5 text-failure" />;
      default: return null;
    }
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
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Test Cases</h2>
          <div className="flex items-center gap-3">
            <Select value={runVersion} onValueChange={setRunVersion}>
              <SelectTrigger className="w-32 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="v1.0">v1.0</SelectItem>
                <SelectItem value="v1.1">v1.1</SelectItem>
                <SelectItem value="v2.0">v2.0</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRunAll} disabled={isRunningAll} variant="outline">
              {isRunningAll ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
              Run All
            </Button>
            <Button onClick={() => { setEditingTestCase(null); setIsModalOpen(true); }} className="bg-primary text-white">
              <Plus className="w-5 h-5 mr-2" /> Add Test Case
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search Test Case..." />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Test Case Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Run Version</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedCases.map((testCase) => (
                <tr key={testCase.id} onClick={() => navigate(`/project/${projectId}/suite/${suiteId}/case/${testCase.id}`)} className="hover:bg-gray-50 cursor-pointer group">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{testCase.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testCase.status)}
                      <span className="text-sm text-gray-600 capitalize">{testCase.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">{testCase.runVersion}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={(e) => handleEdit(testCase, e)} className="p-2 text-gray-400 hover:text-primary"><Pencil className="w-4 h-4" /></button>
                      <button onClick={(e) => handleDelete(testCase.id, testCase.name, e)} className="p-2 text-gray-400 hover:text-failure"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCases.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} itemsPerPage={itemsPerPage} totalItems={filteredCases.length} onPageChange={setCurrentPage} />
        )}
      </main>

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
    </div>
  );
};