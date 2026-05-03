import React from 'react';
import { ArrowLeft, Play, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TestCaseHeaderProps {
    title: string;
    isRunning: boolean;
    onBack: () => void;
    onEdit: () => void;
    onRun: () => void;
}

export const TestCaseHeader: React.FC<TestCaseHeaderProps> = ({
    title,
    isRunning,
    onBack,
    onEdit,
    onRun
}) => {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="w-9 h-9 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-600 hover:text-primary hover:border-primary transition-all hover:scale-105 active:scale-95"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight">
                        {title}
                    </h1>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Button
                    onClick={onEdit}
                    disabled={isRunning}
                    variant="outline"
                    className="h-11 px-6 font-bold text-gray-600 hover:text-primary hover:border-primary rounded-xl transition-all"
                >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Test Case
                </Button>
                <Button
                    onClick={onRun}
                    disabled={isRunning}
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl h-11 px-6 font-bold flex items-center gap-2 transition-all active:scale-[0.98]"
                >
                    <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : 'fill-white'}`} />
                    {isRunning ? 'Running...' : 'Run Test'}
                </Button>
            </div>
        </div>
    );
};
