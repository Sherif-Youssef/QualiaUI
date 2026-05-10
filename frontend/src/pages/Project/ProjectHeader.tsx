import React from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectHeaderProps {
    projectName?: string;
    onBack: () => void;
    onAddSuite: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
    projectName,
    onBack,
    onAddSuite
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="h-12 w-12 rounded-[1.25rem] bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </Button>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight capitalize flex items-center gap-3">
                        {projectName || 'Project Workspace'}
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Workspace Management
                        </span>
                    </div>
                </div>
            </div>


            <div className="flex items-center gap-3">
                <Button
                    onClick={onAddSuite}
                    className="h-11 px-6 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" strokeWidth={3} />
                    Add Test Suite
                </Button>
            </div>
        </div>
    );
};
