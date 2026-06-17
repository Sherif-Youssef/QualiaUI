import React from 'react';
import { Folder, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { ModalHeader } from '../GeneralComponents';
import { Project } from '@/types';

interface ViewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export const ViewProjectModal: React.FC<ViewProjectModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  if (!isOpen || !project) return null;
  const getRoleBadgeClasses = (role?: string) => {
    const r = role?.toLowerCase() || 'no access';
    if (r === 'admin') {
      return 'bg-primary/10 text-primary border-primary/20';
    } else if (r === 'editor') {
      return 'bg-blue-50 text-blue-600 border-blue-100';
    } else if (r === 'viewer') {
      return 'bg-green-50 text-green-600 border-green-100';
    }
    return 'bg-gray-100 text-gray-500 border-gray-200';
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg border border-gray-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader
          title="Project Workspace Details"
          subtitle="Explore metadata and access levels for this project"
          icon={Folder}
          onClose={onClose}
        />

        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-1.5 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            <div className="text-[10px] uppercase font-black tracking-widest text-gray-400">Workspace Name</div>
            <div className="text-xl font-black text-gray-900 break-words">{project.name}</div>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-black tracking-widest text-gray-400 px-1">Description</div>
            <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl max-h-[180px] overflow-y-auto text-sm text-gray-600 leading-relaxed break-words whitespace-pre-wrap">
              {project.description || (
                <span className="italic text-gray-400 font-medium">No description provided for this project.</span>
              )}
            </div>
          </div>

          {project.members && project.members.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-gray-400 px-1">
                <Users className="w-3.5 h-3.5" />
                <span>Workspace Members ({project.members.length})</span>
              </div>
              <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
                {project.members.map((member, index) => (
                  <div key={index} className="p-3 flex items-center justify-between hover:bg-gray-50/30 transition-colors">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-800 truncate">
                        {member.user.firstName} {member.user.lastName}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">
                        {member.user.email}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full border ${getRoleBadgeClasses(member.role)}`}>
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end p-6 border-t border-gray-100 bg-gray-50/50">
          <Button onClick={onClose} className="bg-primary hover:bg-primary/90 text-white h-11 px-8 rounded-xl font-bold shadow-lg shadow-primary/20">
            Close Details
          </Button>
        </div>
      </div>
    </div>
  );
};
