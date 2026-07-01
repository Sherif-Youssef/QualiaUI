import { useState, useEffect, useCallback } from 'react';
import { adminService, UserViewModel } from '@/services/admin/adminService';

export const useAdminUsers = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);
    const [regenerateConfirmation, setRegenerateConfirmation] = useState<{ id: string; name: string } | null>(null);
    const [users, setUsers] = useState<UserViewModel[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [passwordModal, setPasswordModal] = useState<{ pass: string; name: string; title: string } | null>(null);

    const [totalUsers, setTotalUsers] = useState(0);
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

    const itemsPerPage = 6;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const offset = (currentPage - 1) * itemsPerPage;
            const result = await adminService.getAllUsers(offset, itemsPerPage, debouncedSearch);
            
            if (result.users.length === 0 && currentPage > 1 && result.total > 0) {
                setCurrentPage(prev => prev - 1);
                return;
            }

            setUsers(result.users);
            setTotalUsers(result.total);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to fetch users.');
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, debouncedSearch, itemsPerPage]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

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
            await fetchUsers();
            setDeleteConfirmation(null);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to delete user.');
        } finally {
            setModalLoading(false);
        }
    };


    const handleAddUser = async (data: any) => {
        setModalLoading(true);
        setModalError(null);
        try {
            const { user: newUser, temporaryPassword } = await adminService.createUser(data);
            setCurrentPage(1);
            await fetchUsers();
            setIsModalOpen(false);

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

    const handleRegeneratePassword = (userId: string, name: string) => {
        setModalError(null);
        setRegenerateConfirmation({ id: userId, name });
    };

    const confirmRegeneratePassword = async () => {
        if (!regenerateConfirmation) return;

        setModalLoading(true);
        setModalError(null);
        try {
            const result = await adminService.regenerateTempPassword(regenerateConfirmation.id);
            setPasswordModal({ pass: result.temporary_password, name: regenerateConfirmation.name, title: 'Password Regenerated' });
            setRegenerateConfirmation(null);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to regenerate temporary password.');
        } finally {
            setModalLoading(false);
        }
    };

    const isTrulyEmpty = totalUsers === 0 && debouncedSearch === '' && !isLoading;
    const isSearchEmpty = users.length === 0 && debouncedSearch !== '' && !isLoading;

    return {
        users,
        searchQuery, setSearchQuery,
        debouncedSearch,
        currentPage, setCurrentPage,
        itemsPerPage,
        totalUsers,
        totalPages,
        isLoading,
        error, setError,
        isModalOpen, setIsModalOpen,
        deleteConfirmation, setDeleteConfirmation,
        modalLoading,
        modalError, setModalError,
        passwordModal, setPasswordModal,
        isTrulyEmpty,
        isSearchEmpty,
        handleDeleteClick,
        confirmDelete,
        handleAddUser,
        regenerateConfirmation, setRegenerateConfirmation,
        confirmRegeneratePassword,
        handleRegeneratePassword
    };
};
