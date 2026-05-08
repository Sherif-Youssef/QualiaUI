import React from 'react';
import { Settings, Play, History } from 'lucide-react';
import { TestCase } from '@/types/test-case';

interface TestCaseTableProps {
    testCases: TestCase[];
    onNavigate: (id: string) => void;
    onHistory: (id: string) => void;
    onManage: (id: string) => void;
    canManageCases: boolean;
}

export const TestCaseTable: React.FC<TestCaseTableProps> = ({
    testCases,
    onNavigate,
    onHistory,
    onManage
}) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left font-sans">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Test Case Name</th>
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
                            <td className="px-6 py-5 text-right">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNavigate(testCase.id);
                                        }}
                                        className="p-2 text-gray-400 hover:text-primary transition-all active:scale-90"
                                        title="Run Test Case"
                                    >
                                        <Play className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onHistory(testCase.id);
                                        }}
                                        className="p-2 text-gray-400 hover:text-primary transition-all active:scale-90"
                                        title="View History"
                                    >
                                        <History className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onManage(testCase.id);
                                        }}
                                        className="p-2 text-gray-400 hover:text-primary transition-all active:scale-90"
                                        title="Manage Test Case"
                                    >
                                        <Settings className="w-4 h-4" />
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

