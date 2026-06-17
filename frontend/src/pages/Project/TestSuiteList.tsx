import React from 'react';
import { Pencil, Trash2, Layers, ArrowRight, Info } from 'lucide-react';
import { TestSuite } from "@/types";

interface TestSuiteListProps {
    suites: TestSuite[];
    onNavigate: (id: string) => void;
    canManageSuites: boolean;
    onViewDetails: (suite: TestSuite, e: React.MouseEvent) => void;
    onEdit: (suite: TestSuite, e: React.MouseEvent) => void;
    onDelete: (id: string, name: string, e: React.MouseEvent) => void;
}

export const TestSuiteList: React.FC<TestSuiteListProps> = ({
    suites,
    onNavigate,
    canManageSuites,
    onViewDetails,
    onEdit,
    onDelete
}) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-500">
            <div className="overflow-x-auto">
                <table className="w-full text-left font-sans">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Suite Identity</th>
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
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => onViewDetails(suite, e)}
                                            className="p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-gray-100 text-gray-400 hover:text-primary transition-all shadow-none hover:shadow-sm"
                                            title="View Details"
                                        >
                                            <Info className="w-4 h-4" strokeWidth={2} />
                                        </button>
                                        {canManageSuites && (
                                            <button
                                                onClick={(e) => onEdit(suite, e)}
                                                className="p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-gray-100 text-gray-400 hover:text-primary transition-all shadow-none hover:shadow-sm"
                                                title="Edit Suite"
                                            >
                                                <Pencil className="w-4 h-4" strokeWidth={2} />
                                            </button>
                                        )}
                                        {canManageSuites && (
                                            <button
                                                onClick={(e) => onDelete(suite.id, suite.name, e)}
                                                className="p-2.5 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 text-gray-400 hover:text-red-500 transition-all shadow-none hover:shadow-sm"
                                                title="Delete Suite"
                                            >
                                                <Trash2 className="w-4 h-4" strokeWidth={2} />
                                            </button>
                                        )}
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:bg-primary/10 transition-all ml-2">
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
