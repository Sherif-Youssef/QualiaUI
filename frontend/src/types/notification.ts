export interface NotificationDTO {
    id: string;
    title: string;
    description: string;
    type: 'success' | 'warning' | 'info';
    created_at: string;
    is_read: boolean;
}

export interface NotificationViewModel {
    id: string;
    title: string;
    description: string;
    type: 'success' | 'warning' | 'info';
    time: string;
    isRead: boolean;
}