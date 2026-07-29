import { request, type SortOrder, type TenantId } from "../shared";

export interface ProblemNameDto {
  label: string;
  value: string;
}

export interface ProblemDto {
  id: number;
  name: string;
  status: number;
  display_order: number;
  created_at?: string;
  all_names: ProblemNameDto[];
}

export interface ProblemListResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: {
    records: ProblemDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  };
}

export interface ProblemResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: ProblemDto | null;
}

export interface ProblemDropdownOptionDto {
  value: number;
  en_label: string;
  hi_label: string;
}

export interface ProblemDropdownResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: ProblemDropdownOptionDto[];
}

export const problemApi = {
  dropdown: (tenantId: TenantId) =>
    request<ProblemDropdownResponse>("/problem/dropdown", {
      tenantId,
      method: "POST",
      body: JSON.stringify({}),
    }),
  list: (
    tenantId: TenantId,
    accessToken: string,
    data: { page?: number; limit?: number; status?: number; search?: string; sort_order?: SortOrder; date_from?: string; date_to?: string }
  ) =>
    request<ProblemListResponse>("/problem/list", {
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
      translations: { lang_code: string; name: string }[];
    }
  ) =>
    request<ProblemResponse>("/problem", {
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
      translations?: { lang_code: string; name: string }[];
    }
  ) =>
    request<ProblemResponse>("/problem/update", {
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
    request<ProblemResponse>("/problem/status", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
  remove: (tenantId: TenantId, accessToken: string, data: { id: number }) =>
    request<{ success?: boolean; statusCode?: number; message?: string }>("/problem/delete", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
};
