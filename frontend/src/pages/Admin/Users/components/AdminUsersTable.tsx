import React from 'react';
import { UserViewModel } from '@/services/admin/adminService';
import { DesktopTable } from './DesktopTable';
import { MobileGrid } from './MobileGrid';
import { EmptyResults } from './EmptyResults';

interface AdminUsersTableProps {
    users: UserViewModel[];
    onDelete: (id: string, name: string) => void;
    onRegeneratePassword: (userId: string, name: string) => void;
}

export const AdminUsersTable: React.FC<AdminUsersTableProps> = ({
    users,
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
                onDelete={onDelete} 
                onRegeneratePassword={onRegeneratePassword}
            />
            <MobileGrid 
                users={users} 
                onDelete={onDelete} 
                onRegeneratePassword={onRegeneratePassword}
            />
        </div>
    );
};
