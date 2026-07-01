import React from 'react';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';
import { DeleteConfirmationModal } from '@/components/Modal/DeleteConfirmationModal';
import { RegeneratePasswordConfirmationModal } from '@/components/Modal/RegeneratePasswordConfirmationModal';
import { ErrorMessage } from '@/components/GeneralComponents';
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { AddUserModal } from '@/components/Modal/AddUserModal';
import { TempPasswordModal } from '@/components/Modal/TempPasswordModal';

import { AdminUsersHeader } from './components/AdminUsersHeader';
import { AdminUsersTable } from './components/AdminUsersTable';
import { AdminUsersEmptyState } from './components/AdminUsersEmptyState';
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
        deleteConfirmation, setDeleteConfirmation,
        regenerateConfirmation, setRegenerateConfirmation,
        modalLoading,
        modalError, setModalError,
        passwordModal, setPasswordModal,
        isTrulyEmpty,
        isSearchEmpty,
        handleDeleteClick,
        confirmDelete,
        confirmRegeneratePassword,
        handleAddUser,
        handleRegeneratePassword
    } = useAdminUsers();

    return (
        <DashboardLayout
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
                            setModalError(null);
                        }}
                        onAdd={handleAddUser}
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

                    <RegeneratePasswordConfirmationModal
                        isOpen={regenerateConfirmation !== null}
                        onClose={() => {
                            setRegenerateConfirmation(null);
                            setModalError(null);
                        }}
                        onConfirm={confirmRegeneratePassword}
                        userName={regenerateConfirmation?.name}
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
