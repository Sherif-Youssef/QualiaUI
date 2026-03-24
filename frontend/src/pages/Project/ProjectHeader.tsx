import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectHeaderProps {
    onAddSuite: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ onAddSuite }) => {
    return (
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-sans font-semibold text-gray-800">Test Suites</h2>
            <Button
                onClick={onAddSuite}
                className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all rounded-lg"
            >
                <Plus className="w-5 h-5 mr-2" strokeWidth={2} />
                Add Test Suite
            </Button>
        </div>
    );
};
