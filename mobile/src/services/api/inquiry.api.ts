import { apiClient, authHeader } from '@/src/services/api/client';
import { ApiListResponse, ApiSingleResponse } from '@/src/types/common';
import { Inquiry, InquiryStatus } from '@/src/types/inquiry';

type GetTokenFn = (options?: { template?: string }) => Promise<string | null>;
type InquiryListQuery = {
  page?: number;
  limit?: number;
  senderUserId?: string;
  receiverUserId?: string;
};

export const inquiryApi = {
  async getInquiries(query: InquiryListQuery = {}, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.get<ApiListResponse<Inquiry>>('/api/inquiries', {
      headers,
      params: query,
    });
    return response.data;
  },

  async getMyReceivedInquiries(userId?: string, getToken?: GetTokenFn) {
    return this.getInquiries(userId ? { receiverUserId: userId } : {}, getToken);
  },

  async getMySentInquiries(userId: string, getToken?: GetTokenFn) {
    return this.getInquiries({ senderUserId: userId }, getToken);
  },

  async getInquiryById(id: string, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.get<ApiSingleResponse<Inquiry>>(`/api/inquiries/${id}`, { headers });
    return response.data;
  },

  async updateInquiryStatus(id: string, inquiryStatus: InquiryStatus, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.patch<ApiSingleResponse<Inquiry>>(
      `/api/inquiries/${id}/status`,
      { inquiryStatus },
      { headers }
    );
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

  async deleteInquiry(id: string, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.delete<ApiSingleResponse<null>>(`/api/inquiries/${id}`, { headers });
    return response.data;
  },
};
