import React from 'react';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ProjectHeaderProps {
    projectId: string;
    onAddSuite: () => void;
    canManageSuites: boolean;
    canManageProject: boolean;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ 
    projectId, 
    onAddSuite, 
    canManageSuites,
    canManageProject
}) => {
    return (
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-sans font-semibold text-gray-800 tracking-tight uppercase">Test Suites</h2>
            
            <div className="flex items-center gap-3">
                <Link to={`/project/${projectId}/members`}>
                    <Button
                        variant="ghost"
                        className="text-gray-500 hover:text-primary hover:bg-primary/5 font-bold transition-all px-4 flex items-center gap-2"
                    >
                        <Users className="w-5 h-5" />
                        {canManageProject ? "Manage Team" : "View Team"}
                    </Button>
                </Link>

                {canManageSuites && (
                    <Button
                        onClick={onAddSuite}
                        className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10 transition-all rounded-xl h-11 px-6 font-bold"
                    >
                        <Plus className="w-5 h-5 mr-2" strokeWidth={3} />
                        Add Test Suite
                    </Button>
                )}
            </div>
        </div>
    );
};
