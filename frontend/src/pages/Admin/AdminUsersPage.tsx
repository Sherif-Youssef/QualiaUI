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

    const itemsPerPage = 8;

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await adminService.getAllUsers();
                setUsers(data);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to fetch users. Ensure the backend admin endpoints are implemented.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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
            const detail = err.response?.data?.detail;
            const message = typeof detail === 'string' 
                ? detail 
                : Array.isArray(detail)
                    ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
                    : 'Failed to update user.';
            setModalError(message);
        } finally {

            setModalLoading(false);
        }
    };

    const handleAddUser = async (data: any) => {
        setModalLoading(true);
        setModalError(null);
        try {
            const newUser = await adminService.createUser(data);
            setUsers([...users, newUser]);
            setIsModalOpen(false);
            setEditingUser(null);
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            const message = typeof detail === 'string' 
                ? detail 
                : Array.isArray(detail)
                    ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
                    : 'Failed to create user.';
            setModalError(message);
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
                    {error && <div className="mb-6"><ErrorMessage message={error} /></div>}

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
                                users={paginatedUsers}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                            />
                            {filteredUsers.length === 0 && !isLoading && (
                                <div className="text-center py-12 text-gray-500 font-medium bg-white rounded-[2rem] border border-dashed border-gray-200">
                                    No users match your search.
                                </div>
                            )}
                        </>
                    )}
                </>
            }
            pagination={!isEmpty && filteredUsers.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredUsers.length}
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
                        isLoading={modalLoading}
                    />
                </>
            }
        />
    );
};
