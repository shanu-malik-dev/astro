import { request, type TenantId } from "../shared";

export interface EnquiryDto {
  id: number;
  customer_id?: number | null;
  customer_name: string;
  country_code: string;
  mobile: string;
  customer_mobile: string;
  problem_id: number;
  problem_name: string;
  status: number;
  close_remark?: string | null;
  created_at?: string;
}

export interface EnquiryListResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: {
    records: EnquiryDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  };
}

export interface EnquiryResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: EnquiryDto | null;
}

export const enquiryApi = {
  create: (
    tenantId: TenantId,
    data: {
      customer_id?: number;
      customer_name: string;
      country_code: string;
      mobile: string;
      problem_id: number;
      problem_name: string;
    }
  ) =>
    request<EnquiryResponse>("/enquiry", {
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
      status?: number;
      search?: string;
      date_from?: string;
      date_to?: string;
    }
  ) =>
    request<EnquiryListResponse>("/enquiry/list", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
  close: (
    tenantId: TenantId,
    accessToken: string,
    data: { id: number; remark: string }
  ) =>
    request<EnquiryResponse>("/enquiry/close", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
};
