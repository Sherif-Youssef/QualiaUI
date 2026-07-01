import React from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, User, Mail, ShieldAlert } from 'lucide-react';
import { UserViewModel } from '@/services/admin/adminService';

interface DesktopTableProps {
    users: UserViewModel[];
    onEdit: (user: UserViewModel) => void;
    onDelete: (id: string, name: string) => void;
    onRegeneratePassword: (userId: string, name: string) => void;
}

export const DesktopTable: React.FC<DesktopTableProps> = ({
    users,
    onEdit,
    onDelete,
    onRegeneratePassword
}) => {

    return (
        <div className="hidden md:block bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100/50">
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">User Profile</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Role & Permissions</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.map((user) => (
                            <tr key={user.id} className="group hover:bg-white/80 transition-all duration-300">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/5 group-hover:scale-110 transition-transform duration-300">
                                            <User className="w-6 h-6" strokeWidth={1.5} />
                                        </div>
                                        <div className="flex flex-col">
                                            <Link
                                                to={`/profile/${user.id}`}
                                                className="text-base font-black text-gray-900 leading-tight hover:text-primary transition-all pr-2"
                                            >
                                                {user.firstName} {user.lastName}
                                            </Link>
                                            <div className="flex items-center gap-1 text-gray-400 mt-1">
                                                <Mail className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold truncate max-w-[180px]">{user.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-2 bg-primary/5 text-primary border border-primary/10">
                                            {user.role}
                                        </div>
                                        {user.createdAt && (
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest hidden lg:inline">
                                                Joined {new Date(user.createdAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                        <button
                                            onClick={() => onEdit(user)}
                                            className="p-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 text-gray-400 hover:text-primary transition-all active:scale-95"
                                            title="Edit User"
                                        >
                                            <Pencil className="w-5 h-5" strokeWidth={1.5} />
                                        </button>
                                        <button
                                            onClick={() => onRegeneratePassword(user.id, `${user.firstName} ${user.lastName}`)}
                                            className="p-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-100 text-gray-400 hover:text-amber-500 transition-all active:scale-95"
                                            title="Regenerate Temporary Password"
                                        >
                                            <ShieldAlert className="w-5 h-5" strokeWidth={1.5} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(user.id, `${user.firstName} ${user.lastName}`)}
                                            className="p-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-red-100 text-gray-400 hover:text-red-500 transition-all active:scale-95"
                                            title="Delete User"
                                        >
                                            <Trash2 className="w-5 h-5" strokeWidth={1.5} />
                                        </button>
                                    </div>

                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
