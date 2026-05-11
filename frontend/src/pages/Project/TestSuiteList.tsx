import React from 'react';
import { Pencil, Trash2, Layers, ArrowRight } from 'lucide-react';
import { TestSuite } from '@/types/test-suit';

interface TestSuiteListProps {
    suites: TestSuite[];
    onNavigate: (id: string) => void;
    canManageSuites: boolean;
}

export const TestSuiteList: React.FC<TestSuiteListProps> = ({
    suites,
    onNavigate,
    canManageSuites
}) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-500">
            <div className="overflow-x-auto">
                <table className="w-full text-left font-sans">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Suite Identity</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Description</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {suites.map((suite) => (
                            <tr
                                key={suite.id}
                                onClick={() => onNavigate(suite.id)}
                                className="hover:bg-primary/[0.02] transition-all cursor-pointer group"
                            >
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                                            <Layers className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-black text-gray-900 group-hover:text-primary transition-all truncate">
                                                {suite.name}
                                            </span>

                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="max-w-[150px]">
                                        <p
                                            className="text-xs font-medium text-gray-500 truncate leading-relaxed"
                                            title={suite.description || 'No description provided'}
                                        >
                                            {suite.description || 'No description provided'}
                                        </p>
                                    </div>
                                </td>


                                <td className="px-6 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
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
