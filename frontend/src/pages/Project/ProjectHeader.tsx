import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectHeaderProps {
    onAddSuite: () => void;
    canManageSuites: boolean;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
    onAddSuite,
    canManageSuites
}) => {
    return (
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-sans font-black text-gray-900 tracking-tight">
                Project Workspace
            </h2>

            <div className="flex items-center gap-3">
                {canManageSuites && (
                    <Button
                        onClick={onAddSuite}
                        className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10 transition-all rounded-xl h-11 px-6 font-bold flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" strokeWidth={3} />
                        Add Test Suite
                    </Button>
                )}
            </div>
        </div>
    );
};
