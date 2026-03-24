import api from "@/lib/api";

export const TestExecutionService = {
    executeTestCase: async (url: string, prompt?: string) => {
        try {
            const response = await api.post('/api/v1/execute', { url, prompt });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    connectToWebSocket: () => {
        const socket = new WebSocket('ws://backend-url/ws');
        return socket;
    }
};