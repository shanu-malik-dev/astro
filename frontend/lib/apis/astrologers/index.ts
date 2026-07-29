import { request, type SortOrder, type TenantId } from "../shared";
import type { ServiceNameDto } from "../services";

export interface AdminAstrologerDto {
  id: number;
  name: string;
  description: string;
  experience: string;
  expertise: string;
  languages: string;
  rating: number;
  consultations: string;
  status: number;
  created_at?: string;
  all_names: ServiceNameDto[];
}

export interface AdminAstrologerListResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: {
    records: AdminAstrologerDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  };
}

export interface AdminAstrologerResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: AdminAstrologerDto | null;
}

export interface PublicAstrologerDto {
  id: number;
  en_name: string;
  hi_name: string;
  en_description: string;
  hi_description: string;
  en_expertise: string;
  hi_expertise: string;
  experience: string;
  languages: string;
  rating: number;
  consultations: string;
}

export interface PublicAstrologerListResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: {
    records: PublicAstrologerDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  };
}

export const adminAstrologerApi = {
  list: (
    tenantId: TenantId,
    accessToken: string,
    data: { page?: number; limit?: number; status?: number; search?: string; sort_order?: SortOrder; date_from?: string; date_to?: string }
  ) =>
    request<AdminAstrologerListResponse>("/astrologer/list", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
  create: (
    tenantId: TenantId,
    accessToken: string,
    data: {
      experience: string;
      languages: string;
      rating?: number;
      consultations?: string;
      translations: {
        lang_code: string;
        name: string;
        expertise: string;
        description?: string;
      }[];
    }
  ) =>
    request<AdminAstrologerResponse>("/astrologer", {
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
      experience?: string;
      languages?: string;
      rating?: number;
      consultations?: string;
      translations?: {
        lang_code: string;
        name: string;
        expertise: string;
        description?: string;
      }[];
    }
  ) =>
    request<AdminAstrologerResponse>("/astrologer/update", {
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
    request<AdminAstrologerResponse>("/astrologer/status", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
  remove: (tenantId: TenantId, accessToken: string, data: { id: number }) =>
    request<{ success?: boolean; statusCode?: number; message?: string }>("/astrologer/delete", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const astrologerApi = {
  listPublic: (
    tenantId: TenantId,
    data: { page?: number; limit?: number; search?: string }
  ) =>
    request<PublicAstrologerListResponse>("/astrologer/public-list", {
      tenantId,
      method: "POST",
      body: JSON.stringify(data),
    }),
};
