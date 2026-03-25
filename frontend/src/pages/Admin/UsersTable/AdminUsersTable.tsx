import React from 'react';
import { UserViewModel } from '@/services/admin/adminService';
import { DesktopTable } from './DesktopTable';
import { MobileGrid } from './MobileGrid';
import { EmptyResults } from './EmptyResults';

interface AdminUsersTableProps {
    users: UserViewModel[];
    onEdit: (user: UserViewModel) => void;
    onDelete: (id: string, name: string) => void;
    onRegeneratePassword: (userId: string, name: string) => void;
}

export const AdminUsersTable: React.FC<AdminUsersTableProps> = ({
    users,
    onEdit,
    onDelete,
    onRegeneratePassword
}) => {
    if (users.length === 0) {
        return <EmptyResults />;
    }

    return (
        <div className="bg-transparent space-y-4">
            <DesktopTable 
                users={users} 
                onEdit={onEdit} 
                onDelete={onDelete} 
                onRegeneratePassword={onRegeneratePassword}
            />
            <MobileGrid 
                users={users} 
                onEdit={onEdit} 
                onDelete={onDelete} 
                onRegeneratePassword={onRegeneratePassword}
            />
        </div>
    );
};
