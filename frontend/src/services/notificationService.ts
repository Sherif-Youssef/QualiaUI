import api from "@/lib/api";
import { NotificationDTO, NotificationViewModel } from "@/types/notification";
import { mapNotificationToViewModel } from "@/utils/mappers";

export const notificationService = {
    getLatestNotifications: async (): Promise<NotificationViewModel[]> => {
        try {
            // const response = await api.get<NotificationDTO[]>('/notifications');
            // return response.data.map(mapNotificationToViewModel);
            return [
                {
                    id: '1',
                    title: 'System Deployment Success',
                    description: 'The latest build (v2.4.1) has been successfully deployed to the production environment. All health checks passed and integration tests recorded 100% success rate across all project modules. You can check the logs in the dashboard.',
                    type: 'success',
                    time: '2m ago',
                    isRead: false
                },
                {
                    id: '2',
                    title: 'New Security Access',
                    description: 'A new login was detected from a Chrome browser on a Windows device in New York, USA. If this was not you, please rotate your API keys and reset your password immediately in the Security Center.',
                    type: 'warning',
                    time: '12m ago',
                    isRead: false
                },
                {
                    id: '3',
                    title: 'Team Member Joined',
                    description: 'John Doe has just joined the "Qualia-Project-X" workspace. Welcome them to the team! They have been assigned the "Editor" role by default.',
                    type: 'info',
                    time: '1h ago',
                    isRead: false
                }
            ];
        } catch (error) {
            console.error("Error fetching notifications:", error);
            return [];
        }
    },

    markAsRead: async (id: string): Promise<boolean> => {
        try {
            const response = await api.put(`/notifications/${id}/read`);
            return response.data;
        } catch (error) {
            return false;
        }
    },

    markAllAsRead: async (): Promise<boolean> => {
        try {
            const response = await api.put('/notifications/read-all');
            return response.data;
        } catch (error) {
            return false;
        }
    }
};
