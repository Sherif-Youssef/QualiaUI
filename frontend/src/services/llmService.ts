import api, { ApiResponse } from "@/lib/api";
import { 
    Provider, ProviderCreate, ProviderUpdate, 
    LLMModel, LLMModelCreate, LLMModelUpdate,
    ProviderType
} from "@/types/llm";

export const llmService = {
    // Providers
    listProviders: async (offset = 0, limit = 10, displayName?: string, providerType?: ProviderType): Promise<ApiResponse<Provider>> => {
        const response = await api.get<ApiResponse<Provider>>('/llms/providers', {
            params: { offset, limit, display_name: displayName, provider_type: providerType }
        });
        return response.data;
    },

    getProvider: async (providerId: number): Promise<Provider> => {
        const response = await api.get<Provider>(`/llms/providers/${providerId}`);
        return response.data;
    },

    createProvider: async (data: ProviderCreate): Promise<Provider> => {
        const response = await api.post<Provider>('/llms/providers', data);
        return response.data;
    },

    updateProvider: async (providerId: number, data: ProviderUpdate): Promise<Provider> => {
        const response = await api.put<Provider>(`/llms/providers/${providerId}`, data);
        return response.data;
    },

    deleteProvider: async (providerId: number): Promise<void> => {
        await api.delete(`/llms/providers/${providerId}`);
    },

    getProviderApiKey: async (providerId: number): Promise<string | null> => {
        const response = await api.get<{ api_key: string | null }>(`/llms/providers/${providerId}/api-key`);
        return response.data.api_key;
    },

    updateProviderApiKey: async (providerId: number, apiKey: string | null): Promise<void> => {
        await api.put(`/llms/providers/${providerId}/api-key`, { api_key: apiKey });
    },

    // Models
    listModels: async (offset = 0, limit = 10, displayName?: string, providerId?: number): Promise<ApiResponse<LLMModel>> => {
        const response = await api.get<ApiResponse<LLMModel>>('/llms/models', {
            params: { offset, limit, display_name: displayName, provider_id: providerId }
        });
        return response.data;
    },

    getModel: async (modelId: number): Promise<LLMModel> => {
        const response = await api.get<LLMModel>(`/llms/models/${modelId}`);
        return response.data;
    },

    createModel: async (data: LLMModelCreate): Promise<LLMModel> => {
        const response = await api.post<LLMModel>('/llms/models', data);
        return response.data;
    },

    updateModel: async (modelId: number, data: LLMModelUpdate): Promise<LLMModel> => {
        const response = await api.put<LLMModel>(`/llms/models/${modelId}`, data);
        return response.data;
    },

    deleteModel: async (modelId: number): Promise<void> => {
        await api.delete(`/llms/models/${modelId}`);
    }
};
