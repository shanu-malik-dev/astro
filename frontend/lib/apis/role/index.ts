import { request, type PaginationMeta, type SortOrder, type TenantId } from "../shared";

export interface RoleDto {
  id: number;
  name: string;
  status: number;
  modules: string[];
  created_at: string;
  updated_at: string;
}

export interface RoleListResponse {
  statusCode?: number;
  message?: string;
  data?: {
    records: RoleDto[];
    available_modules: string[];
    pagination: PaginationMeta;
  };
}

export interface RoleResponse {
  statusCode?: number;
  message?: string;
  data?: RoleDto;
}

export const roleApi = {
  list: (
    tenantId: TenantId,
    accessToken: string,
    data: { page?: number; limit?: number; search?: string; sort_order?: SortOrder; date_from?: string; date_to?: string }
  ) =>
    request<RoleListResponse>("/roles/list", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
  save: (
    tenantId: TenantId,
    accessToken: string,
    data: { id?: number; name: string; status?: number; modules: string[] }
  ) =>
    request<RoleResponse>("/roles/save", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
};
