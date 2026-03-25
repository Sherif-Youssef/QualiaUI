import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ModalHeader, ErrorMessage } from '@/components/GeneralComponents';
import { adminService } from '@/services/admin/adminService';
import { UserViewModel } from '@/services/admin/adminService';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (userId: number | string, role: string) => void;
    isLoading?: boolean;
    error?: string | null;
    onClearError?: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
    isOpen,
    onClose,
    onAdd,
    isLoading,
    error,
    onClearError
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<'admin' | 'editor' | 'viewer' | 'guest'>('viewer');
    const [suggestions, setSuggestions] = useState<UserViewModel[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserViewModel | null>(null);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (searchQuery.length < 2 || selectedUser) {
                setSuggestions([]);
                return;
            }
            setIsSearching(true);
            try {
                const results = await adminService.searchUsers(searchQuery);
                setSuggestions(results);
            } catch (err) {

            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setSelectedUser(null);
            setSuggestions([]);
            setSelectedRole('viewer');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!selectedUser) return;
        onAdd(selectedUser.id, selectedRole);
    };

    const handleSelectUser = (user: UserViewModel) => {
        setSelectedUser(user);
        setSearchQuery(`${user.firstName} ${user.lastName}`);
        setSuggestions([]);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />
            <div
                className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md border border-gray-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <ModalHeader
                    title="Add Member"
                    subtitle="Invite someone to your project"
                    icon={UserPlus}
                    onClose={onClose}
                />

                <div className="p-6 space-y-6">
                    {error && (
                        <ErrorMessage message={error} onClose={onClearError} />
                    )}

                    <div className="relative">
                        <Label htmlFor="userSearch" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">
                            Search User
                        </Label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                <Search className="w-5 h-5" />
                            </div>
                            <Input
                                id="userSearch"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if (selectedUser) setSelectedUser(null);
                                }}
                                placeholder="Search by name or email..."
                                className="pl-12 rounded-2xl h-14 bg-gray-50 border-gray-100 focus:bg-white font-bold"
                                disabled={isLoading}
                                autoComplete="off"
                            />
                            {selectedUser && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-success">
                                    <Check className="w-5 h-5" />
                                </div>
                            )}
                        </div>

                        { }
                        {suggestions.length > 0 && (
                            <div className="absolute z-[1001] top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                {suggestions.map((user) => (
                                    <div
                                        key={user.id}
                                        onClick={() => handleSelectUser(user)}
                                        className="p-4 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors border-b last:border-0 border-gray-50"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                            {user.firstName[0]}{user.lastName[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-gray-800 truncate">{user.firstName} {user.lastName}</div>
                                            <div className="text-[10px] text-gray-500 font-medium truncate">{user.email}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isSearching && searchQuery.length >= 2 && (
                            <div className="absolute right-12 top-[44px]">
                                <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Assign Role</Label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                <Shield className="w-5 h-5" />
                            </div>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value as any)}
                                className="w-full pl-12 pr-10 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer"
                            >
                                <option value="viewer">Viewer (Read-only access)</option>
                                <option value="editor">Editor (Can create and modify)</option>
                                <option value="admin">Administrator (Full control)</option>
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50">
                    <Button onClick={onClose} variant="ghost" className="h-12 px-6 rounded-xl font-bold" disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="bg-primary hover:bg-primary/90 text-white h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
                        disabled={isLoading || !selectedUser}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Adding...</span>
                            </div>
                        ) : (
                            'Add to Project'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
