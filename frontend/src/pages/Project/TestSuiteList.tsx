import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
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
        <div className="space-y-4">
            {suites.map((suite) => (
                <div
                    key={suite.id}
                    onClick={() => onNavigate(suite.id)}
                    className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer group"
                >
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-800 group-hover:text-primary transition-colors truncate">
                                {suite.name}
                            </h3>
                            {suite.description && (
                                <p
                                    className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed"
                                    title={suite.description}
                                >
                                    {suite.description}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {canManageSuites && (
                                <>
                                    <button
                                        onClick={(e) => onEdit(suite, e)}
                                        className="p-2.5 rounded-xl hover:bg-muted text-gray-400 hover:text-primary transition-all active:scale-90"
                                    >
                                        <Pencil className="w-5 h-5" strokeWidth={1.5} />
                                    </button>
                                    <button
                                        onClick={(e) => onDelete(suite.id, suite.name, e)}
                                        className="p-2.5 rounded-xl hover:bg-failure/10 text-gray-400 hover:text-failure transition-all active:scale-90"
                                    >
                                        <Trash2 className="w-5 h-5" strokeWidth={1.5} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
