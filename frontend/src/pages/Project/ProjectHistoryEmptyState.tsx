import React from 'react';
import { History, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectHistoryEmptyStateProps {
    onRunTests: () => void;
}

export const ProjectHistoryEmptyState: React.FC<ProjectHistoryEmptyStateProps> = ({ onRunTests }) => {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-8">
                <History className="w-12 h-12 text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-sans font-bold text-gray-800 mb-2">No Execution Records</h3>
            <p className="text-gray-500 mb-10 max-w-sm font-sans font-medium">
                You haven't executed any tests for this project yet. Start a run to see logs here.
            </p>
            <Button 
                onClick={onRunTests}
                className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 px-8 py-7 text-lg rounded-2xl transition-all hover:scale-105 active:scale-95 font-bold"
            >
                <PlayCircle className="w-6 h-6 mr-2" />
                Start Your First Run
            </Button>
        </div>
    );
};
