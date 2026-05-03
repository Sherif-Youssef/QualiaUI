import React from 'react';
import { Plus, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TestSuiteHeaderProps {
    isRunningAll: boolean;
    onRunAll: () => void;
    onAddTestCase: () => void;
    canManageCases: boolean;
    onBack: () => void;
}

export const TestSuiteHeader: React.FC<TestSuiteHeaderProps> = ({
    isRunningAll,
    onRunAll,
    onAddTestCase,
    canManageCases,
    onBack
}) => {

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary transition-all group/back"
                    title="Back to Project"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h2 className="text-2xl font-sans font-bold text-gray-800">Test Cases</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">

                {canManageCases && (
                    <>
                        <Button
                            onClick={onRunAll}
                            disabled={isRunningAll}
                            className="h-10 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-lg px-4"
                        >
                            {isRunningAll ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4 mr-2" />
                            )}
                            Run All
                        </Button>

                        <Button
                            onClick={onAddTestCase}
                            className="h-10 bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 rounded-lg px-4"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Test Case
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};
