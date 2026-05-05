import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectLayout } from './ProjectLayout';
import { Button } from '@/components/ui/button';
import { ChevronLeft, UserPlus, Users } from 'lucide-react';
import { projectService } from '@/services/project/projectService';
import { ProjectMembers } from './ProjectMembers';
import { AddMemberModal } from '@/components/Modal/AddMemberModal';
import { ErrorMessage } from '@/components/GeneralComponents';
import { useProjectPermissions } from '@/hooks/useProjectPermissions';
import { Pagination } from '@/components/Pagination';
import { SearchBar } from '@/components/SearchBar';

export const ProjectMembersPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();

    const [projectMembers, setProjectMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { canManageProject, isLoading: permissionsLoading } = useProjectPermissions(projectId);

    useEffect(() => {
        const fetchMembers = async () => {
            if (!projectId) return;
            setIsLoading(true);
            try {
                const project = await projectService.getProjectById(projectId);
                const members = project.members || [];
                setProjectMembers(members);
                setProjectName(project.name);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load project members.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchMembers();
    }, [projectId]);

    const handleMemberAdd = async (userId: number | string, role: string) => {
        if (!projectId) return;
        setModalLoading(true);
        setModalError(null);
        try {
            const updatedProject = await projectService.addMember(projectId, userId, role);
            setProjectMembers(updatedProject.members || []);
            setIsAddMemberModalOpen(false);
            setSearchQuery('');
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to add member.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleMemberRemove = async (email: string) => {
        if (!projectId) return;
        setModalLoading(true);
        setModalError(null);
        try {
            const updatedProject = await projectService.removeMember(projectId, email);
            setProjectMembers(updatedProject.members || []);
        } catch (err: any) {
            setModalError(err.response?.data?.detail || 'Failed to remove member.');
        } finally {
            setModalLoading(false);
        }
    };

    const filteredMembers = projectMembers.filter(member =>
        `${member.user.firstName} ${member.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    const paginatedMembers = filteredMembers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (isLoading || permissionsLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFCFB]">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-bold text-lg animate-pulse">Syncing team permissions...</p>
            </div>
        );
    }

    return (
        <ProjectLayout
            header={
                <div className="flex flex-col gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-400 hover:text-primary transition-all group/back w-fit"
                    >
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover/back:border-primary group-hover/back:text-primary transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] leading-none">
                            Back
                        </span>
                    </button>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/5">
                                <Users className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight uppercase">
                                    Team Management
                                </h1>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                    {projectName} • {projectMembers.length} Members
                                </p>
                            </div>
                        </div>

                        {canManageProject && (
                            <Button
                                onClick={() => setIsAddMemberModalOpen(true)}
                                className="bg-primary hover:bg-primary/90 text-white h-12 px-6 rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95"
                            >
                                <UserPlus className="w-5 h-5" />
                                Add Team Member
                            </Button>
                        )}
                    </div>
                </div>
            }
            searchBar={
                <SearchBar
                    value={searchQuery}
                    onChange={(val) => {
                        setSearchQuery(val);
                        setCurrentPage(1);
                    }}
                    placeholder="Search members by name or email..."
                />
            }
            content={
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

                    <ProjectMembers
                        members={paginatedMembers}
                        canManageMembers={canManageProject}
                        onRemoveMember={handleMemberRemove}
                    />

                    <AddMemberModal
                        isOpen={isAddMemberModalOpen}
                        onClose={() => setIsAddMemberModalOpen(false)}
                        onAdd={handleMemberAdd}
                        isLoading={modalLoading}
                        error={modalError}
                        onClearError={() => setModalError(null)}
                    />
                </div>
            }
            pagination={filteredMembers.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredMembers.length}
                />
            )}
            modals={null}
        />
    );
};
