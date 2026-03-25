import api from "@/lib/api";
import { ProjectDTO, Project } from "@/types/project";
import { mapProjectToViewModel } from "@/utils/mappers";

export const projectService = {
    getAllProjects: async (): Promise<Project[]> => {
        try {
            const response = await api.get<{ items: ProjectDTO[] }>('/projects');
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
    createProject: async (data: { name: string; description: string }): Promise<Project> => {
        try {
            const response = await api.post<ProjectDTO>('/projects', data);
            return mapProjectToViewModel(response.data);
        } catch (error) {
            throw error;
        }
    },
    updateProject: async (id: string, data: { name: string; description: string }): Promise<Project> => {
        try {
            const response = await api.put<ProjectDTO>(`/projects/${id}`, data);
            return mapProjectToViewModel(response.data);
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
