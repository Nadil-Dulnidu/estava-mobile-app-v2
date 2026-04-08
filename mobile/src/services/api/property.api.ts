import { authHeader, apiClient } from '@/src/services/api/client';
import { ApiListResponse, ApiSingleResponse, Property, PropertyFilters, PropertyStatus } from '@/src/types/property';

type GetTokenFn = (options?: { template?: string }) => Promise<string | null>;

const normalizeListResponse = <T>(payload: ApiListResponse<T>): ApiListResponse<T> => ({
  ...payload,
  data: Array.isArray(payload?.data) ? payload.data : [],
});

export const propertyApi = {
  async getPublicProperties(filters: PropertyFilters = {}) {
    const response = await apiClient.get<ApiListResponse<Property>>('/api/public/properties', {
      params: filters,
    });
    return normalizeListResponse(response.data);
  },

  async getPublicPropertyById(id: string) {
    const response = await apiClient.get<ApiSingleResponse<Property>>(`/api/public/properties/${id}`);
    return response.data;
  },

  async getProperties(filters: PropertyFilters, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.get<ApiListResponse<Property>>('/api/properties', {
      headers,
      params: filters,
    });
    return normalizeListResponse(response.data);
  },

  async getMyProperties(filters: PropertyFilters, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.get<ApiListResponse<Property>>('/api/properties/mine', {
      headers,
      params: filters,
    });
    return normalizeListResponse(response.data);
  },

  async getPropertyById(id: string, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.get<ApiSingleResponse<Property>>(`/api/properties/${id}`, { headers });
    return response.data;
  },

  async createProperty(payload: Record<string, unknown>, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.post<ApiSingleResponse<Property>>('/api/properties', payload, {
      headers,
    });
    return response.data;
  },

  async updateProperty(id: string, payload: Record<string, unknown>, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.patch<ApiSingleResponse<Property>>(`/api/properties/${id}`, payload, {
      headers,
    });
    return response.data;
  },

  async deleteProperty(id: string, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.delete<ApiSingleResponse<null>>(`/api/properties/${id}`, { headers });
    return response.data;
  },

  async updatePropertyStatus(id: string, status: PropertyStatus, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.patch<ApiSingleResponse<Property>>(
      `/api/properties/${id}/status`,
      { status },
      { headers }
    );
    return response.data;
  },
};
