import { apiClient, authHeader } from '@/src/services/api/client';
import { ApiListResponse, ApiSingleResponse } from '@/src/types/common';

type GetTokenFn = (options?: { template?: string }) => Promise<string | null>;

export interface Review {
  _id: string;
  userId: string;
  propertyId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const reviewApi = {
  async getReviewsByProperty(propertyId: string, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.get<ApiListResponse<Review>>(`/api/reviews/property/${propertyId}`, {
      headers,
    });
    return response.data;
  },

  async createReview(
    payload: { propertyId: string; rating: number; comment?: string },
    getToken?: GetTokenFn
  ) {
    const headers = await authHeader(getToken);
    const response = await apiClient.post<ApiSingleResponse<Review>>('/api/reviews', payload, { headers });
    return response.data;
  },
};
