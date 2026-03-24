import React from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminUsersHeaderProps {
    onAddUser: () => void;
}

export const AdminUsersHeader: React.FC<AdminUsersHeaderProps> = ({ onAddUser }) => {
    return (
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-sans font-semibold text-gray-800">User Management</h2>
            <Button
                onClick={onAddUser}
                className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all rounded-lg"
            >
                <UserPlus className="w-5 h-5 mr-2" strokeWidth={2} />
                Add User
            </Button>
        </div>
    );
};

