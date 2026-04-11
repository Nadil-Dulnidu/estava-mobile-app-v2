import { apiClient, authHeader } from '@/src/services/api/client';
import { ApiListResponse, ApiSingleResponse } from '@/src/types/common';
import { Appointment, AppointmentStatus } from '@/src/types/appointment';

type GetTokenFn = (options?: { template?: string }) => Promise<string | null>;
type AppointmentListQuery = {
  page?: number;
  limit?: number;
  userId?: string;
  agentId?: string;
};

export const appointmentApi = {
  async getAppointments(query: AppointmentListQuery = {}, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.get<ApiListResponse<Appointment>>('/api/appointments', {
      headers,
      params: query,
    });
    return response.data;
  },

  async getMyReceivedAppointments(userId: string, query: Omit<AppointmentListQuery, 'agentId'> = {}, getToken?: GetTokenFn) {
    return this.getAppointments({ ...query, agentId: userId }, getToken);
  },

  async getMyAppointments(userId: string, query: Omit<AppointmentListQuery, 'userId'> = {}, getToken?: GetTokenFn) {
    return this.getAppointments({ ...query, userId }, getToken);
  },

  async createAppointment(
    payload: {
      propertyId: string;
      appointmentDateTime: string;
      visitPurpose?: string;
      notes?: string;
    },
    getToken?: GetTokenFn
  ) {
    const headers = await authHeader(getToken);
    const response = await apiClient.post<ApiSingleResponse<Appointment>>('/api/appointments', payload, {
      headers,
    });
    return response.data;
  },

  async updateAppointmentStatus(id: string, appointmentStatus: AppointmentStatus, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.patch<ApiSingleResponse<Appointment>>(
      `/api/appointments/${id}/status`,
      { appointmentStatus },
      { headers }
    );
    return response.data;
  },

  async deleteAppointment(id: string, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.delete<ApiSingleResponse<null>>(`/api/appointments/${id}`, { headers });
    return response.data;
  },
};
