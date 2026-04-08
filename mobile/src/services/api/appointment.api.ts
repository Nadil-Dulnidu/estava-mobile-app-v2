import { apiClient, authHeader } from '@/src/services/api/client';
import { ApiListResponse, ApiSingleResponse } from '@/src/types/common';
import { Appointment, AppointmentStatus } from '@/src/types/appointment';

type GetTokenFn = (options?: { template?: string }) => Promise<string | null>;

export const appointmentApi = {
  async getAppointments(query: { page?: number; limit?: number } = {}, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.get<ApiListResponse<Appointment>>('/api/appointments', {
      headers,
      params: query,
    });
    return response.data;
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
};
