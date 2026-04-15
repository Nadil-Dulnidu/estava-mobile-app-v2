import { apiClient, authHeader } from '@/src/services/api/client';
import { ApiListResponse, ApiSingleResponse } from '@/src/types/common';

type GetTokenFn = (options?: { template?: string }) => Promise<string | null>;

export const FAVORITE_NOTE_MAX_LENGTH = 500;

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

  async addFavorite(propertyId: string, getToken?: GetTokenFn, note?: string | null) {
    const headers = await authHeader(getToken);
    const payload = {
      propertyId,
      ...(note !== undefined ? { note } : {}),
    };

    const response = await apiClient.post<ApiSingleResponse<Favorite>>(
      '/api/favorites',
      payload,
      { headers }
    );
    return response.data;
  },

  async updateFavoriteNote(id: string, note: string | null, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.patch<ApiSingleResponse<Favorite>>(
      `/api/favorites/${id}/note`,
      { note },
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
