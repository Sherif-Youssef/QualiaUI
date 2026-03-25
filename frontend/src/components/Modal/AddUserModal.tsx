import React, { useEffect, useState } from 'react';
import { X, User, Mail, Shield, ShieldAlert, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/GeneralComponents';

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: any) => Promise<void>;
    editingUser?: any;
    onEdit: (id: string, data: any) => Promise<void>;
    error: string | null;
    isLoading: boolean;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
    isOpen,
    onClose,
    onAdd,
    editingUser,
    onEdit,
    error,
    isLoading,
}) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('viewer');

    useEffect(() => {
        if (editingUser) {
            setFirstName(editingUser.firstName);
            setLastName(editingUser.lastName);
            setUsername(editingUser.username || '');
            setEmail(editingUser.email);
            setRole(editingUser.role || 'viewer');
            setPassword('');
        } else {
            setFirstName('');
            setLastName('');
            setUsername('');
            setEmail('');
            setPassword('');
            setRole('viewer');
        }
    }, [editingUser, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const userData = {
            first_name: firstName,
            last_name: lastName,
            username: username,
            email: email,
            password: password || undefined,
            role: role
        };

        if (editingUser) {
            onEdit(editingUser.id, userData);
        } else {
            onAdd(userData);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />

            <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-500 scale-100 opacity-100 flex flex-col max-h-[90vh]">
                <div className="p-8 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/5">
                            {editingUser ? <ShieldAlert className="w-6 h-6" /> : <User className="w-6 h-6" />}
                        </div>
                        <h2 className="text-2xl font-sans font-extrabold text-gray-900 tracking-tight">
                            {editingUser ? 'Edit User Profile' : 'Register New User'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all active:scale-95">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-grow">
                    {error && <div className="mb-6"><ErrorMessage message={error} /></div>}

                    <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest pl-1">First Name</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                        placeholder="Sherif"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest pl-1">Last Name</label>
                                <input
                                    required
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                    placeholder="Youssef"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest pl-1">Username</label>
                                <input
                                    required
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                    placeholder="sherif_admin"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest pl-1">Email address</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input
                                        required
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                        placeholder="sherif@qualia.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {!editingUser && (
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest pl-1">Temporary Password</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                        <Key className="w-5 h-5" />
                                    </div>
                                    <input
                                        required
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 pt-4">
                            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest pl-1">Assign User Role</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full pl-12 pr-10 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer"
                                >
                                    <option value="viewer">Viewer (Read-only access)</option>
                                    <option value="editor">Editor (Can create and modify)</option>
                                    <option value="admin">Administrator (Full control)</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-8 border-t border-gray-50 bg-gray-50/20 grid grid-cols-2 gap-4 flex-shrink-0">
                    <Button
                        type="button"
                        onClick={onClose}
                        variant="secondary"
                        className="py-6 border-none bg-white font-extrabold rounded-2xl hover:bg-white hover:shadow-md transition-all active:scale-95 text-gray-500"
                    >
                        Cancel
                    </Button>
                    <Button
                        form="user-form"
                        type="submit"
                        disabled={isLoading}
                        className="py-6 bg-primary font-extrabold rounded-2xl hover:bg-primary/90 hover:shadow-lg transition-all active:scale-95 shadow-md shadow-primary/20"
                    >
                        {isLoading ? 'Processing...' : (editingUser ? 'Save Updates' : 'Confirm Registration')}
                    </Button>
                </div>
            </div>
        </div>
    );
};
