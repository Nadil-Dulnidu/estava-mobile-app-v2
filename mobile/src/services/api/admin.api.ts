import { apiClient, authHeader } from '@/src/services/api/client';
import { ApiListResponse, ApiSingleResponse } from '@/src/types/common';
import { Property } from '@/src/types/property';

type GetTokenFn = (options?: { template?: string }) => Promise<string | null>;

export interface AdminDashboardSummary {
  totalProperties: number;
  pendingModeration: number;
  approvedProperties: number;
  rejectedProperties: number;
  recentProperties: number;
  totalAppointments: number;
  totalInquiries: number;
}

export const adminApi = {
  async getDashboardSummary(getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.get<ApiSingleResponse<AdminDashboardSummary>>(
      '/api/admin/dashboard/summary',
      { headers }
    );
    return response.data;
  },

  async getModerationProperties(getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.get<ApiListResponse<Property>>('/api/admin/properties/moderation', {
      headers,
    });
    return response.data;
  },

  async moderateProperty(
    id: string,
    payload: { moderationStatus: 'pending' | 'approved' | 'rejected'; moderationNote?: string },
    getToken?: GetTokenFn
  ) {
    const headers = await authHeader(getToken);
    const response = await apiClient.patch<ApiSingleResponse<Property>>(
      `/api/admin/properties/${id}/moderation`,
      payload,
      { headers }
    );
    return response.data;
  },
};
