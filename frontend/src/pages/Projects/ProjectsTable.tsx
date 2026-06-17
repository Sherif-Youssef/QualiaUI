import React from 'react';
import { Pencil, Trash2, Info } from 'lucide-react';
import { Project } from "@/types";
interface ProjectsTableProps {
    projects: Project[];
    onNavigate: (id: string) => void;
    onViewDetails: (project: Project, e: React.MouseEvent) => void;
    onEdit: (project: Project, e: React.MouseEvent) => void;
    onDelete: (id: string, name: string, e: React.MouseEvent) => void;
    isAdmin: boolean;
}

export const ProjectsTable: React.FC<ProjectsTableProps> = ({
    projects,
    onNavigate,
    onViewDetails,
    onEdit,
    onDelete,
    isAdmin
}) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left font-sans">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">
                            Workspace Name
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-black text-gray-400 uppercase tracking-widest">
                            Your Role
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {projects.map((project) => {
                        const hasProjectAccess = !!project.role || isAdmin;
                        const effectiveIsAdmin = project.role ? project.role === 'admin' : isAdmin;
                        const effectiveRole = project.role ? project.role : (isAdmin ? 'admin' : 'no access');

                        return (
                            <tr
                                key={project.id}
                                onClick={() => hasProjectAccess && onNavigate(project.id)}
                                className={`transition-all group ${hasProjectAccess
                                    ? 'hover:bg-primary/[0.02] cursor-pointer'
                                    : 'opacity-60 cursor-not-allowed bg-gray-50/30'}`}
                            >
                                <td className="px-6 py-5">
                                    <div className="flex flex-col max-w-[400px] w-full min-w-0">
                                        <span className={`text-sm font-black transition-all ${hasProjectAccess ? 'text-gray-900 group-hover:text-primary' : 'text-gray-400'}`}>
                                            {project.name}
                                        </span>

                                    </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border transition-colors ${effectiveIsAdmin
                                        ? 'bg-primary/10 text-primary border-primary/20'
                                        : effectiveRole === 'editor'
                                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                                            : effectiveRole === 'no access'
                                                ? 'bg-red-50 text-red-600 border-red-100'
                                                : 'bg-gray-100 text-gray-500 border-gray-200'
                                        }`}>
                                        {effectiveRole}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => onViewDetails(project, e)}
                                            className="p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-gray-100 text-gray-400 hover:text-primary transition-all shadow-none hover:shadow-sm"
                                            title="View Details"
                                        >
                                            <Info className="w-4 h-4" strokeWidth={2} />
                                        </button>
                                        {effectiveIsAdmin && (
                                            <button
                                                onClick={(e) => onEdit(project, e)}
                                                className="p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-gray-100 text-gray-400 hover:text-primary transition-all shadow-none hover:shadow-sm"
                                                title="Edit Workspace"
                                            >
                                                <Pencil className="w-4 h-4" strokeWidth={2} />
                                            </button>
                                        )}
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
