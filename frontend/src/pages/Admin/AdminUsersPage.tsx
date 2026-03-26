import React, { useState, useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';
import { DeleteConfirmationModal } from '@/components/Modal/DeleteConfirmationModal';
import { ErrorMessage } from '@/components/GeneralComponents';
import { adminService, UserViewModel } from '@/services/admin/adminService';
import { ProjectsLayout } from "@/pages/Projects/ProjectsLayout";

import { AdminUsersHeader } from './AdminUsersHeader';
import { AdminUsersTable } from './UsersTable/AdminUsersTable';
import { AddUserModal } from '@/components/Modal/AddUserModal';
import { AdminUsersEmptyState } from './AdminUsersEmptyState';
import { TempPasswordModal } from '@/components/Modal/TempPasswordModal';

export const AdminUsersPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserViewModel | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);
    const [users, setUsers] = useState<UserViewModel[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [passwordModal, setPasswordModal] = useState<{ pass: string; name: string; title: string } | null>(null);

    const [totalUsers, setTotalUsers] = useState(0);
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

    const itemsPerPage = 8;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const offset = (currentPage - 1) * itemsPerPage;
                const result = await adminService.getAllUsers(offset, itemsPerPage, debouncedSearch);
                setUsers(result.users);
                setTotalUsers(result.total);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to fetch users.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, [currentPage, debouncedSearch]);

    const totalPages = Math.ceil(totalUsers / itemsPerPage);


    const handleDeleteClick = (id: string, name: string) => {
        setModalError(null);
        setDeleteConfirmation({ id, name });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation) return;

        setModalLoading(true);
        setModalError(null);
        try {
            await adminService.deleteUser(deleteConfirmation.id);
            setUsers(users.filter(u => u.id !== deleteConfirmation.id));
            setDeleteConfirmation(null);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to delete user.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleEditClick = (user: UserViewModel) => {
        setEditingUser(user);
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleUpdateUser = async (id: string, data: any) => {
        setModalLoading(true);
        setModalError(null);
        try {
            const updatedUser = await adminService.updateUser(id, data);
            setUsers(users.map(u => u.id === id ? updatedUser : u));
            setIsModalOpen(false);
            setEditingUser(null);
        } catch (err: any) {
            setModalError(adminService.formatError(err, 'Failed to update user.'));
        } finally {

            setModalLoading(false);
        }
    };

    const handleAddUser = async (data: any) => {
        setModalLoading(true);
        setModalError(null);
        try {
            const { user: newUser, temporaryPassword } = await adminService.createUser(data);
            setUsers([...users, newUser]);
            setIsModalOpen(false);
            setEditingUser(null);

            if (temporaryPassword) {
                setPasswordModal({
                    pass: temporaryPassword,
                    name: `${newUser.firstName} ${newUser.lastName}`,
                    title: 'User Created Successfully'
                });
            }
        } catch (err: any) {
            setModalError(adminService.formatError(err, 'Failed to create user.'));
        } finally {

            setModalLoading(false);
        }
    };

    const handleRegeneratePassword = async (userId: string, name: string) => {
        if (!window.confirm(`Are you sure you want to regenerate a temporary password for ${name}?`)) return;

        setModalLoading(true);
        setModalError(null);
        try {
            const result = await adminService.regenerateTempPassword(userId);
            setPasswordModal({ pass: result.temporary_password, name: name, title: 'Password Regenerated' });
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to regenerate temporary password.');
        } finally {
            setModalLoading(false);
        }
    };

    const isEmpty = users.length === 0 && !isLoading;

    return (
        <ProjectsLayout
            header={!isEmpty && <AdminUsersHeader onAddUser={() => {
                setModalError(null);
                setIsModalOpen(true);
            }} />}
            searchBar={!isEmpty && (
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
                    ) : isEmpty ? (
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

                            {users.length === 0 && !isLoading && (
                                <div className="text-center py-12 text-gray-500 font-medium bg-white rounded-[2rem] border border-dashed border-gray-200">
                                    No users match your search.
                                </div>
                            )}
                        </>
                    )}
                </>
            }
            pagination={!isEmpty && totalUsers > 0 && (
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
