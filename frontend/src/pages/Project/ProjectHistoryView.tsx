import React from 'react';
import { ProjectRun } from '@/types/run';
import { ProjectHistoryTable } from './ProjectHistoryTable';

interface ProjectHistoryViewProps {
    history: ProjectRun[];
    isLoading: boolean;
    onView: (id: number) => void;
}

export const ProjectHistoryView: React.FC<ProjectHistoryViewProps> = ({
    history,
    isLoading,
    onView
}) => {
    if (isLoading && history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Loading history...</p>
            </div>
        );
    }

    return (
        <ProjectHistoryTable 
            runs={history} 
            onView={onView}
        />
    );
};
