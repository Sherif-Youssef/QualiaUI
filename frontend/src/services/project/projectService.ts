import api, { ApiResponse } from "@/lib/api";
import { ProjectDTO, Project } from "@/types/project";
import { mapProjectToViewModel } from "@/utils/mappers";

export const projectService = {
    getAllProjects: async (): Promise<Project[]> => {
        try {
            const response = await api.get<ApiResponse<ProjectDTO>>('/projects');
            return response.data.items.map(mapProjectToViewModel);
        } catch (error) {
            throw error;
        }
    },
    getProjectById: async (id: string): Promise<Project> => {
        try {
            const response = await api.get<ProjectDTO>(`/projects/${id}`);
            return mapProjectToViewModel(response.data);
        } catch (error) {
            throw error;
        }
    },
    createProject: async (data: { name: string; description: string; members?: Array<{ user_id: number | string; role: string }> }): Promise<Project> => {
        try {
            const response = await api.post<ProjectDTO>('/projects', data);
            return mapProjectToViewModel(response.data);
        } catch (error) {
            throw error;
        }
    },
    updateProject: async (id: string, data: { name?: string; description?: string; members?: Array<{ user_id: number | string; role: string }> }): Promise<Project> => {
        try {
            const response = await api.put<ProjectDTO>(`/projects/${id}`, data);
            return mapProjectToViewModel(response.data);
        } catch (error) {
            throw error;
        }
    },
    addMember: async (projectId: string, userId: number | string, role: string): Promise<Project> => {
        try {
            const response = await api.get<ProjectDTO>(`/projects/${projectId}`);
            const projectDTO = response.data;
            const existingMembers = (projectDTO.members || []).map((m: any) => ({
                user_id: m.user.id,
                role: m.role
            }));

            const updatedMembers = [...existingMembers, { user_id: Number(userId), role }];

            return await projectService.updateProject(projectId, {
                members: updatedMembers
            });
        } catch (error) {
            throw error;
        }
    },
    removeMember: async (projectId: string, userEmail: string): Promise<Project> => {
        try {
            const response = await api.get<ProjectDTO>(`/projects/${projectId}`);
            const projectDTO = response.data;

            const updatedMembers = (projectDTO.members || [])
                .filter((m: any) => m.user.email !== userEmail)
                .map((m: any) => ({
                    user_id: m.user.id,
                    role: m.role
                }));

            return await projectService.updateProject(projectId, {
                members: updatedMembers
            });
        } catch (error) {
            throw error;
        }
    },
    deleteProject: async (id: string) => {
        try {
            await api.delete(`/projects/${id}`);
        } catch (error) {
            throw error;
        }
    }
};
