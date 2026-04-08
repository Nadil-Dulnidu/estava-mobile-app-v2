import { apiClient, authHeader } from '@/src/services/api/client';
import { ApiListResponse, ApiSingleResponse } from '@/src/types/common';

type GetTokenFn = (options?: { template?: string }) => Promise<string | null>;

export interface Favorite {
  _id: string;
  userId: string;
  propertyId: string | { _id: string; title?: string; city?: string; images?: { url: string }[] };
  note?: string | null;
  priorityLevel?: number | null;
  createdAt: string;
  updatedAt: string;
}

export const favoriteApi = {
  async getMyFavorites(getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.get<ApiSingleResponse<Favorite[]> | ApiListResponse<Favorite>>(
      '/api/favorites',
      { headers }
    );
    const payload = response.data as any;
    const data = Array.isArray(payload.data) ? payload.data : [];
    return { ...payload, data };
  },

  async addFavorite(propertyId: string, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.post<ApiSingleResponse<Favorite>>(
      '/api/favorites',
      { propertyId },
      { headers }
    );
    return response.data;
  },

  async removeFavorite(id: string, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.delete<ApiSingleResponse<null>>(`/api/favorites/${id}`, { headers });
    return response.data;
  },
};
