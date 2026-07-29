import { request, type TenantId } from "../shared";

export interface FollowUpDto {
  id: number;
  enq_id: number;
  customer_name: string;
  country_code: string;
  mobile: string;
  customer_mobile: string;
  problem_name: string;
  remark: string;
  status: number;
  follow_up_at?: string;
  created_at?: string;
}

export interface FollowUpListResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: {
    records: FollowUpDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  };
}

export interface FollowUpResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: FollowUpDto | null;
}

export const followUpApi = {
  create: (
    tenantId: TenantId,
    accessToken: string,
    data: { enq_id: number; status: number; remark: string; follow_up_at: string }
  ) =>
    request<FollowUpResponse>("/follow-up", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
  list: (
    tenantId: TenantId,
    accessToken: string,
    data: {
      page?: number;
      limit?: number;
      status?: number;
      search?: string;
      date_from?: string;
      date_to?: string;
    }
  ) =>
    request<FollowUpListResponse>("/follow-up/list", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
};
