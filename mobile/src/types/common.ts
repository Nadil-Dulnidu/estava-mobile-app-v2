export interface ApiMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  [key: string]: unknown;
}

export interface ApiListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: ApiMeta;
}

export interface ApiSingleResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
