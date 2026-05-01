import React from 'react';
import { Plus, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TestSuiteHeaderProps {
    isRunningAll: boolean;
    onRunAll: () => void;
    onAddTestCase: () => void;
    canManageCases: boolean;
}

export const TestSuiteHeader: React.FC<TestSuiteHeaderProps> = ({
    isRunningAll,
    onRunAll,
    onAddTestCase,
    canManageCases
}) => {

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-sans font-bold text-gray-800">Test Cases</h2>
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
