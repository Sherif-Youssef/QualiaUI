import React from 'react';
import { AddTestSuiteModal } from '@/components/Modal/AddTestSuiteModal';
import { DeleteConfirmationModal } from '@/components/Modal/DeleteConfirmationModal';
import { AddMemberModal } from '@/components/Modal/AddMemberModal';
import { TestSuite } from '@/types/test-suit';

interface ProjectModalsProps {
    isSuiteModalOpen: boolean;
    onCloseSuiteModal: () => void;
    editingSuite: TestSuite | null;
    onAddSuite: (data: { name: string; description: string }) => void;
    onEditSuite: (id: string, data: { name: string; description: string }) => void;

    deleteConfirmation: { id: string; name: string } | null;
    onCloseDeleteModal: () => void;
    onConfirmDelete: () => void;

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
    editingSuite,
    onAddSuite,
    onEditSuite,
    deleteConfirmation,
    onCloseDeleteModal,
    onConfirmDelete,
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
                editingSuite={editingSuite}
                onEdit={onEditSuite}
                error={error}
                onClearError={onClearError}
                isLoading={isLoading}
            />

            <DeleteConfirmationModal
                isOpen={deleteConfirmation !== null}
                onClose={onCloseDeleteModal}
                onConfirm={onConfirmDelete}
                itemName={deleteConfirmation?.name}
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
