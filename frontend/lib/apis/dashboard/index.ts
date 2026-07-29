import { request, type TenantId } from "../shared";

export interface DashboardSummaryDto {
  enquiries: {
    open: number;
    closed: number;
    total: number;
  };
  follow_ups: {
    hot: number;
    warm: number;
    cold: number;
    total: number;
  };
  customers: {
    called: number;
    not_called: number;
    total: number;
  };
}

export interface DashboardSummaryResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: DashboardSummaryDto;
}

export const dashboardApi = {
  summary: (
    tenantId: TenantId,
    accessToken: string,
    data: { date_from?: string; date_to?: string }
  ) =>
    request<DashboardSummaryResponse>("/dashboard/summary", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
};
