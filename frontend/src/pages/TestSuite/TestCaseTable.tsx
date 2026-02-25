import React from 'react';
import { Pencil, Trash2, Circle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { TestCase } from '@/types';

interface TestCaseTableProps {
    testCases: TestCase[];
    onNavigate: (id: string) => void;
    onEdit: (testCase: TestCase, e: React.MouseEvent) => void;
    onDelete: (id: string, name: string, e: React.MouseEvent) => void;
}

const getStatusIcon = (status: TestCase['status']) => {
    switch (status) {
        case 'idle': return <Circle className="w-5 h-5 text-gray-300" />;
        case 'running': return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
        case 'passed': return <CheckCircle2 className="w-5 h-5 text-success" />;
        case 'failed': return <XCircle className="w-5 h-5 text-failure" />;
        default: return null;
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
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Test Case Name</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Version</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {testCases.map((testCase) => (
                        <tr
                            key={testCase.id}
                            onClick={() => onNavigate(testCase.id)}
                            className="hover:bg-gray-50/80 cursor-pointer group transition-colors"
                        >
                            <td className="px-6 py-4">
                                <span className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">
                                    {testCase.name}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(testCase.status)}
                                    <span className="text-sm text-gray-600 font-medium capitalize">{testCase.status}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-wider rounded-full border border-primary/10">
                                    {testCase.runVersion}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1">
                                    <button
                                        onClick={(e) => onEdit(testCase, e)}
                                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => onDelete(testCase.id, testCase.name, e)}
                                        className="p-2 text-gray-400 hover:text-failure hover:bg-failure/5 rounded-lg transition-all"
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
