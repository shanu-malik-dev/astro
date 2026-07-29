import { request, type TenantId } from "../shared";

export type SupportRequestStatus = number;

export interface SupportRequestDto {
  id: string;
  full_name: string;
  email: string;
  subject?: string | null;
  message: string;
  status: SupportRequestStatus;
  created_at: string;
  updated_at?: string;
}

export interface SupportRequestResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: SupportRequestDto | null;
}

export interface SupportRequestListResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: {
    records: SupportRequestDto[];
    counts?: Record<number | "total", number>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  };
}

export const supportApi = {
  create: (
    tenantId: TenantId,
    data: {
      full_name: string;
      email: string;
      subject?: string;
      message: string;
    }
  ) =>
    request<SupportRequestResponse>("/support", {
      tenantId,
      method: "POST",
      body: JSON.stringify(data),
    }),
  list: (
    tenantId: TenantId,
    accessToken: string,
    data: {
      page?: number;
      limit?: number;
      status?: SupportRequestStatus;
      range?: "today" | "all";
      search?: string;
      date_from?: string;
      date_to?: string;
    }
  ) =>
    request<SupportRequestListResponse>("/support/list", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateStatus: (
    tenantId: TenantId,
    accessToken: string,
    data: { id: number; status: SupportRequestStatus }
  ) =>
    request<SupportRequestResponse>("/support/status", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
};
