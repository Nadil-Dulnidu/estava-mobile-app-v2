import { apiClient, authHeader } from '@/src/services/api/client';
import { ApiListResponse, ApiSingleResponse } from '@/src/types/common';
import { AppNotification, NotificationStatus } from '@/src/types/notification';

type GetTokenFn = (options?: { template?: string }) => Promise<string | null>;

export const notificationApi = {
  async getNotifications(
    query: { page?: number; limit?: number; status?: NotificationStatus },
    getToken?: GetTokenFn
  ) {
    const headers = await authHeader(getToken);
    const response = await apiClient.get<ApiListResponse<AppNotification>>('/api/notifications', {
      headers,
      params: query,
    });
    return response.data;
  },

  async markReadState(id: string, status: NotificationStatus, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.patch<ApiSingleResponse<AppNotification>>(
      `/api/notifications/${id}/read`,
      { status },
      { headers }
    );
    return response.data;
  },

  async clearAll(getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.delete<ApiSingleResponse<{ deletedCount: number }>>(
      '/api/notifications',
      { headers }
    );
    return response.data;
  },
};
