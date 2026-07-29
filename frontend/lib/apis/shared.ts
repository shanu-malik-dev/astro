import { apiService, ApiError } from "../api-service";
import type { TenantId } from "../tenant";

export { ApiError };
export type { TenantId };

export interface RequestOptions extends RequestInit {
  tenantId: TenantId;
  accessToken?: string | null;
}

export async function request<T>(
  path: string,
  { tenantId, accessToken, headers, ...options }: RequestOptions
): Promise<T> {
  return apiService<T>(path, {
    ...options,
    headers: {
      "x-tenant-id": tenantId,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export type SortOrder = "asc" | "desc";
