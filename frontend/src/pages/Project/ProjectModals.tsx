import React from 'react';
import { AddTestSuiteModal } from '@/components/Modal/AddTestSuiteModal';
import { AddMemberModal } from '@/components/Modal/AddMemberModal';

interface ProjectModalsProps {
    isSuiteModalOpen: boolean;
    onCloseSuiteModal: () => void;
    onAddSuite: (data: { name: string; description: string }) => void;

    isAddMemberModalOpen: boolean;
    onCloseMemberModal: () => void;
    onAddMember: (userId: number | string, role: string) => void;

    isLoading: boolean;
    error: string | null;
    onClearError: () => void;
}

export const ProjectModals: React.FC<ProjectModalsProps> = ({
    isSuiteModalOpen,
    onCloseSuiteModal,
    onAddSuite,
    isAddMemberModalOpen,
    onCloseMemberModal,
    onAddMember,
    isLoading,
    error,
    onClearError
}) => {
    return (
        <>
            <AddTestSuiteModal
                isOpen={isSuiteModalOpen}
                onClose={onCloseSuiteModal}
                onAdd={onAddSuite}
                error={error}
                onClearError={onClearError}
                isLoading={isLoading}
            />

            <AddMemberModal
                isOpen={isAddMemberModalOpen}
                onClose={onCloseMemberModal}
                onAdd={onAddMember}
                isLoading={isLoading}
                error={error}
                onClearError={onClearError}
            />
        </>
    );
};
