import React from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, User, Mail, ShieldCheck, ShieldAlert, Calendar } from 'lucide-react';
import { UserViewModel } from '@/services/admin/adminService';

interface MobileGridProps {
    users: UserViewModel[];
    onEdit: (user: UserViewModel) => void;
    onDelete: (id: string, name: string) => void;
    onRegeneratePassword: (userId: string, name: string) => void;
}

export const MobileGrid: React.FC<MobileGridProps> = ({ 
    users, 
    onEdit, 
    onDelete, 
    onRegeneratePassword 
}) => {
    return (
        <div className="grid grid-cols-1 gap-4 md:hidden">
            {users.map((user) => (
                <div key={user.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col gap-6 active:scale-[0.98] transition-all">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/5">
                                <User className="w-7 h-7" strokeWidth={1.5} />
                            </div>
                            <div className="flex flex-col">
                                <Link
                                    to={`/profile/${user.id}`}
                                    className="text-lg font-black text-gray-900 hover:text-primary transition-all"
                                >
                                    {user.firstName} {user.lastName}
                                </Link>
                                <span className="text-xs font-bold text-gray-400 mt-0.5 uppercase tracking-widest">@{user.username || 'user'}</span>
                            </div>
                        </div>
                        <div className={`p-2 rounded-xl border ${user.isAdmin ? 'bg-red-50 text-red-600 border-red-100' : 'bg-primary/5 text-primary border-primary/10'}`}>
                            {user.isAdmin ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-bold text-gray-600 truncate">{user.email}</span>
                        </div>
                        {user.createdAt && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-bold text-gray-600">Member since {new Date(user.createdAt).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                        <button
                            onClick={() => onEdit(user)}
                            className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95"
                            title="Edit"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onRegeneratePassword(user.id, `${user.firstName} ${user.lastName}`)}
                            className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all active:scale-95"
                            title="Reset"
                        >
                            <ShieldAlert className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(user.id, `${user.firstName} ${user.lastName}`)}
                            className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                </div>
            ))}
        </div>
    );
};
