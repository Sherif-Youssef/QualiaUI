import React from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectHeaderProps {
    onBack: () => void;
    onAddSuite: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
    onBack,
    onAddSuite
}) => {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary transition-all group/back"
                    title="Back to Projects"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-sans font-black text-gray-900 tracking-tight">
                    Project Workspace
                </h2>
            </div>


            <div className="flex items-center gap-3">
                <Button
                    onClick={onAddSuite}
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10 transition-all rounded-xl h-11 px-6 font-bold flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" strokeWidth={3} />
                    Add Test Suite
                </Button>
            </div>
        </div>
    );
};
