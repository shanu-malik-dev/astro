import { request, type SortOrder, type TenantId } from "../shared";
import type { ServiceNameDto } from "../services";

export interface AdminAstrologerDto {
  id: number;
  image?: string;
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
  image?: string;
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
  live?: boolean;
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

export interface AstrologerStatusDto {
  id: number;
  start_time: string;
  end_time: string;
  created_at?: string;
  updated_at?: string;
}

export interface AstrologerStatusResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: AstrologerStatusDto | null;
}

export interface AstrologerImageUploadResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: {
    url: string;
    path: string;
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
      image?: string;
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
      image?: string;
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
  uploadImage: (tenantId: TenantId, accessToken: string, file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    return request<AstrologerImageUploadResponse>("/astrologer/upload-image", {
      tenantId,
      accessToken,
      method: "POST",
      body: formData,
    });
  },
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
  statusDetails: (tenantId: TenantId, accessToken: string) =>
    request<AstrologerStatusResponse>("/astrologer-status/details", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify({}),
    }),
  saveStatus: (
    tenantId: TenantId,
    accessToken: string,
    data: { start_time: string; end_time: string }
  ) =>
    request<AstrologerStatusResponse>("/astrologer-status/save", {
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
