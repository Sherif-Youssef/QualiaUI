import React from 'react';
import { Trash2, User, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProjectMember {
    user: { id: string | number, firstName: string, lastName: string, email: string };
    role: 'admin' | 'editor' | 'viewer' | 'guest';
    joinedAt: string;
}

interface ProjectMembersProps {
    members: ProjectMember[];
    canManageMembers: boolean;
    onRemoveMember: (email: string) => void;
}

export const ProjectMembers: React.FC<ProjectMembersProps> = ({
    members,
    canManageMembers,
    onRemoveMember
}) => {
    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Team Member
                        </th>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">
                            Email Address
                        </th>
                        <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Role
                        </th>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest hidden lg:table-cell">
                            Joined At
                        </th>
                        {canManageMembers && (
                            <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Actions
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {members.length > 0 ? (
                        members.map((member) => (
                            <tr
                                key={member.user.email}
                                className="hover:bg-gray-50/50 transition-all group"
                            >
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm border border-primary/10 shadow-sm shrink-0">
                                            {member.user.firstName[0]}{member.user.lastName[0]}
                                        </div>
                                        <div className="flex flex-col">
                                            <Link 
                                                to={`/profile/${member.user.id}`}
                                                className="text-sm font-black text-gray-900 hover:text-primary transition-colors leading-tight"
                                            >
                                                {member.user.firstName} {member.user.lastName}
                                            </Link>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter md:hidden">
                                                {member.user.email}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5 hidden md:table-cell">
                                    <span className="text-sm font-medium text-gray-600">{member.user.email}</span>
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <div className="flex items-center justify-center">
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 text-primary border border-primary/10 shadow-sm transition-all hover:bg-primary/10">
                                            <Shield className="w-3 h-3" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.05em]">
                                                {member.role}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5 hidden lg:table-cell">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        {new Date(member.joinedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </td>
                                {canManageMembers && (
                                    <td className="px-8 py-5">
                                        <div className="flex items-center justify-end">
                                            <button 
                                                onClick={() => onRemoveMember(member.user.email)}
                                                className="p-2.5 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                title="Remove Member"
                                            >
                                                <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={canManageMembers ? 5 : 4} className="py-16 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <User className="w-8 h-8 text-gray-200" />
                                    <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">No team members identified</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

