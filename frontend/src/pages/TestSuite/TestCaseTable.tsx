import React from 'react';
import { Pencil, Trash2, Circle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { TestCase, TestStatus } from '@/types/test-case';

interface TestCaseTableProps {
    testCases: TestCase[];
    onNavigate: (id: string) => void;
    onEdit: (testCase: TestCase, e: React.MouseEvent) => void;
    onDelete: (id: string, name: string, e: React.MouseEvent) => void;
    canManageCases: boolean;
}

const getStatusIcon = (status: TestStatus) => {
    switch (status) {
        case 'idle':
            return <Circle className="w-5 h-5 text-gray-300" />;
        case 'running':
            return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
        case 'passed':
        case 'success':
        case 'executed':
            return <CheckCircle className="w-5 h-5 text-success" />;
        case 'failed':
        case 'failure':
            return <XCircle className="w-5 h-5 text-failure" />;
        default:
            return <Circle className="w-5 h-5 text-gray-200" />;
    }
};

export const TestCaseTable: React.FC<TestCaseTableProps> = ({
    testCases,
    onNavigate,
    onEdit,
    onDelete
}) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left font-sans">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Test Case Name</th>
                        <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Execution Status</th>
                        <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Version</th>
                        <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {testCases.map((testCase) => (
                        <tr
                            key={testCase.id}
                            onClick={() => onNavigate(testCase.id)}
                            className="hover:bg-primary/[0.02] cursor-pointer group transition-all duration-200"
                        >
                            <td className="px-6 py-5">
                                <div className="flex flex-col max-w-[300px]">
                                    <span className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                                        {testCase.name}
                                    </span>
                                    {testCase.description && (
                                        <p
                                            className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed"
                                            title={testCase.description}
                                        >
                                            {testCase.description}
                                        </p>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <div className="flex items-center justify-center gap-3">
                                    {getStatusIcon(testCase.status)}
                                    <span className="text-xs text-gray-500 font-black uppercase tracking-tighter min-w-[70px]">
                                        {testCase.status}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                                <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-wider rounded-full border border-gray-200 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-colors">
                                    {testCase.runVersion || 'v1.0'}
                                </span>
                            </td>
                            <td className="px-6 py-5 text-right">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => onEdit(testCase, e)}
                                        className="p-2 text-gray-400 hover:text-primary transition-all active:scale-90"
                                        title="Edit Test Case"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => onDelete(testCase.id, testCase.name, e)}
                                        className="p-2 text-gray-400 hover:text-failure transition-all active:scale-90"
                                        title="Delete Test Case"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
