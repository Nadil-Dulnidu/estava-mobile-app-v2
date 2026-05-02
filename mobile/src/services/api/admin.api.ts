import { apiClient, authHeader } from '@/src/services/api/client';
import { ApiSingleResponse } from '@/src/types/common';

type GetTokenFn = (options?: { template?: string }) => Promise<string | null>;

export interface AdminDashboardSummary {
  totalProperties: number;
  recentProperties: number;
  totalAppointments: number;
  totalInquiries: number;
}

export interface AdminDashboardAnalyticsPoint {
  date: string;
  count: number;
  saleCount: number;
  rentCount: number;
}

export interface AdminDashboardDistributionPoint {
  label: string;
  count: number;
}

export interface AdminDashboardAnalytics {
  days: number;
  dailyListings: AdminDashboardAnalyticsPoint[];
  byType: AdminDashboardDistributionPoint[];
  byStatus: AdminDashboardDistributionPoint[];
  reviewMetrics: {
    totalReviews: number;
    averageRating: number;
    lowRatingCount: number;
  };
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

  async getDashboardAnalytics(query: { days?: number } = {}, getToken?: GetTokenFn) {
    const headers = await authHeader(getToken);
    const response = await apiClient.get<ApiSingleResponse<AdminDashboardAnalytics>>(
      '/api/admin/dashboard/analytics',
      { headers, params: query }
    );
    return response.data;
  },
};
