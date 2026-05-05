import React from 'react';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';
import { DeleteConfirmationModal } from '@/components/Modal/DeleteConfirmationModal';
import { ErrorMessage } from '@/components/GeneralComponents';
import { ProjectsLayout } from "@/pages/Projects/ProjectsLayout";
import { AddUserModal } from '@/components/Modal/AddUserModal';
import { TempPasswordModal } from '@/components/Modal/TempPasswordModal';

import { AdminUsersHeader } from './AdminUsersHeader';
import { AdminUsersTable } from './UsersTable/AdminUsersTable';
import { AdminUsersEmptyState } from './AdminUsersEmptyState';
import { useAdminUsers } from './hooks/useAdminUsers';

export const AdminUsersPage: React.FC = () => {
    const {
        users,
        searchQuery, setSearchQuery,
        currentPage, setCurrentPage,
        itemsPerPage,
        totalUsers,
        totalPages,
        isLoading,
        error, setError,
        isModalOpen, setIsModalOpen,
        editingUser, setEditingUser,
        deleteConfirmation, setDeleteConfirmation,
        modalLoading,
        modalError, setModalError,
        passwordModal, setPasswordModal,
        isTrulyEmpty,
        isSearchEmpty,
        handleDeleteClick,
        confirmDelete,
        handleEditClick,
        handleUpdateUser,
        handleAddUser,
        handleRegeneratePassword
    } = useAdminUsers();

    return (
        <ProjectsLayout
            header={<AdminUsersHeader onAddUser={() => {
                setModalError(null);
                setIsModalOpen(true);
            }} />}
            searchBar={(
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search Users..."
                />
            )}
            content={
                <>
                    {error && <div className="mb-6"><ErrorMessage message={error} onClose={() => setError(null)} /></div>}

                    {isLoading && users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 font-bold text-lg">Syncing user directory...</p>
                        </div>
                    ) : isTrulyEmpty ? (
                        <AdminUsersEmptyState onCreateNew={() => {
                            setModalError(null);
                            setIsModalOpen(true);
                        }} />
                    ) : (
                        <>
                            <AdminUsersTable
                                users={users}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                                onRegeneratePassword={handleRegeneratePassword}
                            />

                            {isSearchEmpty && (
                                <div className="text-center py-12 text-gray-500 font-medium bg-white rounded-[2rem] border border-dashed border-gray-200">
                                    No users match your search.
                                </div>
                            )}
                        </>
                    )}
                </>
            }
            pagination={totalUsers > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalUsers}
                    onPageChange={setCurrentPage}
                />
            )}
            modals={
                <>
                    <AddUserModal
                        isOpen={isModalOpen}
                        onClose={() => {
                            setIsModalOpen(false);
                            setEditingUser(null);
                            setModalError(null);
                        }}
                        onAdd={handleAddUser}
                        editingUser={editingUser}
                        onEdit={handleUpdateUser}
                        error={modalError}
                        onClearError={() => setModalError(null)}
                        isLoading={modalLoading}
                    />

                    <DeleteConfirmationModal
                        isOpen={deleteConfirmation !== null}
                        onClose={() => {
                            setDeleteConfirmation(null);
                            setModalError(null);
                        }}
                        onConfirm={confirmDelete}
                        itemName={deleteConfirmation?.name}
                        error={modalError}
                        onClearError={() => setModalError(null)}
                        isLoading={modalLoading}
                    />

                    <TempPasswordModal
                        isOpen={passwordModal !== null}
                        onClose={() => setPasswordModal(null)}
                        password={passwordModal?.pass || ''}
                        userName={passwordModal?.name || ''}
                        title={passwordModal?.title}
                    />
                </>
            }
        />
    );
};
