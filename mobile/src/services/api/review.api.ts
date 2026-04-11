import { apiClient, authHeader } from '@/src/services/api/client';
import { ApiListResponse, ApiSingleResponse } from '@/src/types/common';

type GetTokenFn = (options?: { template?: string }) => Promise<string | null>;

export interface Review {
  _id: string;
  userId: string;
  userName?: string | null;
  propertyId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const reviewApi = {
  async getReviewsByProperty(propertyId: string, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const hasAuth = Boolean((headers as Record<string, string>).Authorization);
    const endpoint = hasAuth
      ? `/api/reviews/property/${propertyId}`
      : `/api/public/properties/${propertyId}/reviews`;

    const response = await apiClient.get<ApiListResponse<Review>>(endpoint, hasAuth ? { headers } : undefined);
    return response.data;
  },

  async createReview(
    payload: { propertyId: string; rating: number; comment?: string; userName?: string },
    getToken?: GetTokenFn
  ) {
    const headers = await authHeader(getToken);
    const response = await apiClient.post<ApiSingleResponse<Review>>('/api/reviews', payload, { headers });
    return response.data;
  },

  async updateReview(id: string, payload: { rating?: number; comment?: string }, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.patch<ApiSingleResponse<Review>>(`/api/reviews/${id}`, payload, {
      headers,
    });
    return response.data;
  },

  async deleteReview(id: string, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.delete<ApiSingleResponse<null>>(`/api/reviews/${id}`, { headers });
    return response.data;
  },
};
