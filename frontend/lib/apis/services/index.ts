import { request, type SortOrder, type TenantId } from "../shared";

export interface ServiceDto {
  id: string | number;
  name: string;
  category?: string;
  description?: string;
  price?: number;
  durationMinutes?: number;
  isActive?: boolean;
  createdAt?: string;
  en_label?: string;
  hi_label?: string;
  all_names?: ServiceNameDto[];
}

export interface ServiceNameDto {
  label: string;
  value: string;
  expertise?: string;
  description?: string;
}

export interface AdminServiceDto {
  id: number;
  name: string;
  description: string;
  status: number;
  display_order: number;
  created_at?: string;
  all_names: ServiceNameDto[];
}

export interface AdminServiceListResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: {
    records: AdminServiceDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  };
}

export interface AdminServiceResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: AdminServiceDto | null;
}

export interface ServiceDropdownOptionDto {
  value: number;
  en_label: string;
  hi_label: string;
}

export interface ServiceDropdownResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: ServiceDropdownOptionDto[];
}

export interface ServicePublicListResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: ServiceDto[];
}

export const adminServiceApi = {
  dropdown: (tenantId: TenantId) =>
    request<ServiceDropdownResponse>("/service/dropdown", {
      tenantId,
      method: "POST",
      body: JSON.stringify({}),
    }),
  publicList: (tenantId: TenantId) =>
    request<ServicePublicListResponse>("/service/public-list", {
      tenantId,
      method: "POST",
      body: JSON.stringify({}),
    }),
  list: (
    tenantId: TenantId,
    accessToken: string,
    data: { page?: number; limit?: number; status?: number; search?: string; sort_order?: SortOrder; date_from?: string; date_to?: string }
  ) =>
    request<AdminServiceListResponse>("/service/list", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
  create: (
    tenantId: TenantId,
    accessToken: string,
    data: {
      display_order?: number;
      translations: { lang_code: string; name: string; description?: string }[];
    }
  ) =>
    request<AdminServiceResponse>("/service", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (
    tenantId: TenantId,
    accessToken: string,
    data: {
      id: number;
      display_order?: number;
      translations?: { lang_code: string; name: string; description?: string }[];
    }
  ) =>
    request<AdminServiceResponse>("/service/update", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateStatus: (
    tenantId: TenantId,
    accessToken: string,
    data: { id: number; status: number }
  ) =>
    request<AdminServiceResponse>("/service/status", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
  remove: (tenantId: TenantId, accessToken: string, data: { id: number }) =>
    request<{ success?: boolean; statusCode?: number; message?: string }>("/service/delete", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
};
