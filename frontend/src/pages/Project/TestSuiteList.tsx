import React from 'react';
import { Pencil, Trash2, Layers, ArrowRight } from 'lucide-react';
import { TestSuite } from '@/types/test-suit';

interface TestSuiteListProps {
    suites: TestSuite[];
    onNavigate: (id: string) => void;
    onEdit: (suite: TestSuite, e: React.MouseEvent) => void;
    onDelete: (id: string, name: string, e: React.MouseEvent) => void;
    canManageSuites: boolean;
}

export const TestSuiteList: React.FC<TestSuiteListProps> = ({
    suites,
    onNavigate,
    onEdit,
    onDelete,
    canManageSuites
}) => {
    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden transition-all duration-500">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Suite Identity</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Description</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {suites.map((suite) => (
                            <tr
                                key={suite.id}
                                onClick={() => onNavigate(suite.id)}
                                className="hover:bg-primary/[0.02] transition-all cursor-pointer group"
                            >
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                                            <Layers className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-black text-gray-900 group-hover:text-primary transition-all truncate">
                                                {suite.name}
                                            </span>

                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <p className="text-xs font-medium text-gray-500 line-clamp-1 max-w-md leading-relaxed">
                                        {suite.description || 'No description provided'}
                                    </p>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                                        {canManageSuites && (
                                            <>
                                                <button
                                                    onClick={(e) => onEdit(suite, e)}
                                                    className="p-2 rounded-xl hover:bg-muted text-gray-400 hover:text-primary transition-all active:scale-90"
                                                    title="Edit Suite"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => onDelete(suite.id, suite.name, e)}
                                                    className="p-2 rounded-xl hover:bg-failure/10 text-gray-400 hover:text-failure transition-all active:scale-90"
                                                    title="Delete Suite"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
