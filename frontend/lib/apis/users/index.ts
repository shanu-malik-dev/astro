import { request, type PaginationMeta, type SortOrder, type TenantId } from "../shared";

export interface AdminUserDto {
  id: number;
  role_id: number;
  role_name: string;
  name: string;
  country_code: string;
  mobile: string;
  customer_mobile: string;
  email: string;
  status: number;
  call_status: number;
  created_at: string;
  updated_at: string;
}

export interface AdminUserListResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: {
    records: AdminUserDto[];
    pagination: PaginationMeta;
  };
}

export interface AdminUserResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: AdminUserDto;
}

export const adminUserApi = {
  list: (
    tenantId: TenantId,
    accessToken: string,
    data: {
      page?: number;
      limit?: number;
      role_id?: number;
      search?: string;
      sort_order?: SortOrder;
      range?: "today" | "all";
      call_status?: number;
      date_from?: string;
      date_to?: string;
    }
  ) =>
    request<AdminUserListResponse>("/users/list", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
  save: (
    tenantId: TenantId,
    accessToken: string,
    data: {
      id?: number;
      role_id: number;
      name: string;
      country_code?: string;
      mobile: string;
      email: string;
      password?: string;
      status?: number;
    }
  ) =>
    request<AdminUserResponse>("/users/save", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (tenantId: TenantId, accessToken: string, data: { id: number }) =>
    request<{ success?: boolean; statusCode?: number; message?: string }>("/users/delete", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCallStatus: (
    tenantId: TenantId,
    accessToken: string,
    data: { id: number; call_status: number }
  ) =>
    request<AdminUserResponse>("/users/call-status", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
};
