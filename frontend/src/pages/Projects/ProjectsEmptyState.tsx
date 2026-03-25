import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectsEmptyStateProps {
    onCreateNew: () => void;
    isAdmin: boolean;
}

export const ProjectsEmptyState: React.FC<ProjectsEmptyStateProps> = ({ onCreateNew, isAdmin }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Plus className="w-12 h-12 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-sans font-bold text-gray-800 mb-2">No projects yet</h2>
            <p className="text-gray-500 mb-8 max-w-sm">
                Organize your tests by creating your first project. Projects help you group related test suites and cases.
            </p>
            {isAdmin && (
                <Button
                    onClick={onCreateNew}
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg px-8 py-6 text-lg rounded-xl transition-all hover:shadow-xl hover:-translate-y-1 active:scale-95"
                >
                    <Plus className="w-6 h-6 mr-2" strokeWidth={2.5} />
                    Create New Project
                </Button>
            )}
        </div>
    );
};
