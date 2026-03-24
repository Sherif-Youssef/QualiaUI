import React from 'react';
import { Plus, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TestSuiteHeaderProps {
    runVersion: string;
    setRunVersion: (val: string) => void;
    isRunningAll: boolean;
    onRunAll: () => void;
    onAddTestCase: () => void;
}

export const TestSuiteHeader: React.FC<TestSuiteHeaderProps> = ({
    runVersion,
    setRunVersion,
    isRunningAll,
    onRunAll,
    onAddTestCase
}) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-sans font-bold text-gray-800">Test Cases</h2>
            <div className="flex flex-wrap items-center gap-3">
                <Select value={runVersion} onValueChange={setRunVersion}>
                    <SelectTrigger className="w-28 h-10 border-gray-300 rounded-lg">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="v1.0">v1.0</SelectItem>
                        <SelectItem value="v1.1">v1.1</SelectItem>
                        <SelectItem value="v2.0">v2.0</SelectItem>
                    </SelectContent>
                </Select>

                <Button
                    onClick={onRunAll}
                    disabled={isRunningAll}
                    variant="outline"
                    className="h-10 border-primary text-primary hover:bg-primary/5 rounded-lg px-4"
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
                    className="h-10 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-lg px-4"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Test Case
                </Button>
            </div>
        </div>
    );
};
