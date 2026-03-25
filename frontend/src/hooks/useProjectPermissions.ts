import { useState, useEffect } from 'react';
import { authService } from '@/services/auth/auth';
import { projectService } from '@/services/project/projectService';

export interface ProjectPermissions {
    canManageProject: boolean;
    canManageSuites: boolean;
    canManageCases: boolean;
    canViewResults: boolean;
    role: 'admin' | 'editor' | 'viewer';
    isOrgAdmin: boolean;
    isLoading: boolean;
    error: string | null;
}

export const useProjectPermissions = (projectId?: string): ProjectPermissions => {
    const [permissions, setPermissions] = useState<ProjectPermissions>({
        canManageProject: false,
        canManageSuites: false,
        canManageCases: false,
        canViewResults: false,
        role: 'viewer',
        isOrgAdmin: false,
        isLoading: true,
        error: null
    });

    useEffect(() => {
        const fetchPermissions = async () => {
            if (!projectId) {
                setPermissions(prev => ({ ...prev, isLoading: false }));
                return;
            }

            try {
                const [user, project] = await Promise.all([
                    authService.getCurrentUser(),
                    projectService.getProjectById(projectId)
                ]);

                const isOrgAdmin = user.is_admin || user.role?.toLowerCase() === 'admin';
                const orgRole = (user.role?.toLowerCase() || 'viewer');
                let effectiveRole = orgRole;
                let explicitRole: string | undefined = project.role?.toLowerCase();
                if (!explicitRole && project.members) {
                    const myRec = project.members.find(m => String(m.user.id) === String(user.id));
                    if (myRec) explicitRole = myRec.role.toLowerCase();
                }
                if (explicitRole) {
                    effectiveRole = explicitRole;
                } else if (isOrgAdmin) {
                    effectiveRole = 'admin';
                }

                const isAdmin = effectiveRole === 'admin';
                const isEditorOrAbove = isAdmin || effectiveRole === 'editor';
                const isViewerOrAbove = isEditorOrAbove || effectiveRole === 'viewer';

                setPermissions({
                    canManageProject: isAdmin,
                    canManageSuites: isEditorOrAbove,
                    canManageCases: isEditorOrAbove,
                    canViewResults: isViewerOrAbove,
                    role: effectiveRole as 'admin' | 'editor' | 'viewer',
                    isOrgAdmin,
                    isLoading: false,
                    error: null
                });
            } catch (err: any) {
                setPermissions(prev => ({ 
                    ...prev, 
                    isLoading: false, 
                    error: err.response?.data?.detail || 'Failed to load permissions.' 
                }));
            }
        };

        fetchPermissions();
    }, [projectId]);

    return permissions;
};
