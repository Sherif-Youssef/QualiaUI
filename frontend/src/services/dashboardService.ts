import api from "@/lib/api";
import { DashboardData, DashboardDTO } from "@/types/dashboard";
import { mapDashboardToViewModel } from "@/utils/mappers";

export const dashboardService = {
    getDashboardData: async (): Promise<DashboardData> => {
        try {
            const response = await api.get<DashboardDTO>('/dashboard');
            return mapDashboardToViewModel(response.data);
        } catch (error) {
            console.error("Dashboard Service Error:", error);
            throw error;
        }
    }
};
