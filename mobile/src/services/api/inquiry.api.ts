import { apiClient, authHeader } from '@/src/services/api/client';
import { ApiListResponse, ApiSingleResponse } from '@/src/types/common';
import { Inquiry } from '@/src/types/inquiry';

type GetTokenFn = (options?: { template?: string }) => Promise<string | null>;

export const inquiryApi = {
  async getMyReceivedInquiries(getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.get<ApiListResponse<Inquiry>>('/api/inquiries', {
      headers,
    });
    return response.data;
  },

  async getInquiryById(id: string, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.get<ApiSingleResponse<Inquiry>>(`/api/inquiries/${id}`, { headers });
    return response.data;
  },

  async replyToInquiry(id: string, replyMessage: string, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.patch<ApiSingleResponse<Inquiry>>(
      `/api/inquiries/${id}/reply`,
      { replyMessage },
      { headers }
    );
    return response.data;
  },

  async createInquiry(
    payload: { propertyId: string; subject?: string; message: string; contactNumber?: string },
    getToken?: GetTokenFn
  ) {
    const headers = await authHeader(getToken);
    const response = await apiClient.post<ApiSingleResponse<Inquiry>>('/api/inquiries', payload, { headers });
    return response.data;
  },
};
