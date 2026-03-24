import React from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminUsersEmptyStateProps {
    onCreateNew: () => void;
}

export const AdminUsersEmptyState: React.FC<AdminUsersEmptyStateProps> = ({ onCreateNew }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500 bg-white/50 backdrop-blur-md rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <UserPlus className="w-12 h-12 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-sans font-bold text-gray-800 mb-2">No users found</h2>
            <p className="text-gray-500 mb-8 max-w-sm">
                The user directory is currently empty. Start by adding your first team member to the platform.
            </p>
            <Button
                onClick={onCreateNew}
                className="bg-primary hover:bg-primary/90 text-white shadow-lg px-8 py-6 text-lg rounded-xl transition-all hover:shadow-xl hover:-translate-y-1 active:scale-95"
            >
                <UserPlus className="w-6 h-6 mr-2" strokeWidth={2.5} />
                Add New User
            </Button>
        </div>
    );
};
