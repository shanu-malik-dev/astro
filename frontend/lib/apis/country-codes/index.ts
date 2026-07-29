import { request, type PaginationMeta, type SortOrder, type TenantId } from "../shared";

export interface CountryCodeDto {
  id: number;
  country_name: string;
  country_code: string;
  mobile_prefix: string | null;
  logo?: string | null;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface CountryCodeListResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: {
    records: CountryCodeDto[];
    pagination: PaginationMeta;
  };
}

export interface CountryCodeResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: CountryCodeDto | null;
}

export const countryCodeApi = {
  list: (
    tenantId: TenantId,
    accessToken: string,
    data: { page?: number; limit?: number; search?: string; sort_order?: SortOrder; date_from?: string; date_to?: string }
  ) =>
    request<CountryCodeListResponse>("/shared/countries/list", {
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
      country_name: string;
      country_code: string;
      mobile_prefix: string;
      logo?: string;
      status?: number;
    }
  ) =>
    request<CountryCodeResponse>("/shared/countries/save", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (tenantId: TenantId, accessToken: string, data: { id: number }) =>
    request<{ success?: boolean; statusCode?: number; message?: string }>("/shared/countries/delete", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
};
