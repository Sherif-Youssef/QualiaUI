import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Project } from '@/types/project';

interface ProjectsTableProps {
    projects: Project[];
    onNavigate: (id: string) => void;
    onEdit: (project: Project, e: React.MouseEvent) => void;
    onDelete: (id: string, name: string, e: React.MouseEvent) => void;
    isAdmin: boolean;
    userRole?: string;
}

export const ProjectsTable: React.FC<ProjectsTableProps> = ({
    projects,
    onNavigate,
    onEdit,
    onDelete,
    isAdmin,
    userRole
}) => {
    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                        <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Workspace Name
                        </th>
                        <th className="px-8 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Your Role
                        </th>
                        <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                        {projects.map((project) => {
                            const effectiveIsAdmin = project.role ? project.role === 'admin' : isAdmin;
                            const effectiveRole = project.role ? project.role : (isAdmin ? 'admin' : (userRole || 'viewer'));

                            return (
                                <tr
                                    key={project.id}
                                    onClick={() => onNavigate(project.id)}
                                    className="hover:bg-gray-50/50 transition-all cursor-pointer group"
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col max-w-[400px]">
                                            <span className="text-sm font-black text-gray-900 group-hover:text-primary transition-all">
                                                {project.name}
                                            </span>
                                            {project.description && (
                                                <p 
                                                    className="text-[11px] font-medium text-gray-400 mt-1 line-clamp-2 leading-relaxed"
                                                    title={project.description}
                                                >
                                                    {project.description}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border transition-colors ${
                                            effectiveIsAdmin 
                                                ? 'bg-primary/10 text-primary border-primary/20' 
                                                : effectiveRole === 'editor'
                                                ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                : 'bg-gray-100 text-gray-500 border-gray-200'
                                        }`}>
                                            {effectiveRole}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {}
                                            {effectiveIsAdmin && (
                                                <button
                                                    onClick={(e) => onEdit(project, e)}
                                                    className="p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-gray-100 text-gray-400 hover:text-primary transition-all shadow-none hover:shadow-sm"
                                                    title="Edit Workspace"
                                                >
                                                    <Pencil className="w-4 h-4" strokeWidth={2} />
                                                </button>
                                            )}
                                            {}
                                            {effectiveIsAdmin && (
                                                <button
                                                    onClick={(e) => onDelete(project.id, project.name, e)}
                                                    className="p-2.5 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 text-gray-400 hover:text-red-500 transition-all shadow-none hover:shadow-sm"
                                                    title="Delete Workspace"
                                                >
                                                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                </tbody>
            </table>
        </div>
    );
};
