import React from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectMembers } from './ProjectMembers';

interface ProjectTeamViewProps {
    members: any[];
    isLoading: boolean;
    canManageProject: boolean;
    onInvite: () => void;
    onRemoveMember: (email: string) => void;
}

export const ProjectTeamView: React.FC<ProjectTeamViewProps> = ({
    members,
    isLoading,
    canManageProject,
    onInvite,
    onRemoveMember
}) => {
    if (isLoading && members.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Loading team...</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Team Members</h3>
                {canManageProject && (
                    <Button
                        onClick={onInvite}
                        className="bg-primary/10 text-primary hover:bg-primary/20 rounded-xl font-bold px-4 h-10 border border-primary/10 transition-all"
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Invite Member
                    </Button>
                )}
            </div>
            <ProjectMembers
                members={members}
                canManageMembers={canManageProject}
                onRemoveMember={onRemoveMember}
            />
        </>
    );
};
