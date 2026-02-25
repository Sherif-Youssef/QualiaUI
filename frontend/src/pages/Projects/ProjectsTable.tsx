import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Project } from '@/types';

interface ProjectsTableProps {
    projects: Project[];
    onNavigate: (id: string) => void;
    onEdit: (project: Project, e: React.MouseEvent) => void;
    onDelete: (id: string, name: string, e: React.MouseEvent) => void;
}

export const ProjectsTable: React.FC<ProjectsTableProps> = ({
    projects,
    onNavigate,
    onEdit,
    onDelete
}) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Project Name
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {projects.map((project) => (
                        <tr
                            key={project.id}
                            onClick={() => onNavigate(project.id)}
                            className="hover:bg-gray-50 transition-colors cursor-pointer group"
                        >
                            <td className="px-6 py-4">
                                <div>
                                    <span className="text-sm font-medium text-gray-800 group-hover:text-primary transition-colors">
                                        {project.name}
                                    </span>
                                    {project.description && (
                                        <p className="text-xs text-gray-500 mt-0.5">{project.description}</p>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={(e) => onEdit(project, e)}
                                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" strokeWidth={1.5} />
                                    </button>
                                    <button
                                        onClick={(e) => onDelete(project.id, project.name, e)}
                                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
