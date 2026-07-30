import { request, type SortOrder, type TenantId } from "../shared";
import type { ServiceNameDto } from "../services";

export interface ProductDto {
  id: number;
  product_code: string;
  product_image: string;
  product_price: number;
  name: string;
  description: string;
  status: number;
  display_order: number;
  created_at?: string;
  all_names: ServiceNameDto[];
  hi_label?: string;
}

export interface ProductListResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: {
    records: ProductDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  };
}

export interface ProductResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: ProductDto | null;
}

export interface ProductPublicListResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: ProductDto[];
}

export interface ProductPurchaseResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: {
    product_id: number;
    product_name: string;
    amount: number;
    currency: string;
    payment_link: string;
    provider_payment_id: string;
  };
}

export const productApi = {
  list: (
    tenantId: TenantId,
    accessToken: string,
    data: { page?: number; limit?: number; status?: number; search?: string; sort_order?: SortOrder; date_from?: string; date_to?: string }
  ) =>
    request<ProductListResponse>("/product/list", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
  publicList: (tenantId: TenantId) =>
    request<ProductPublicListResponse>("/product/public-list", {
      tenantId,
      method: "POST",
      body: JSON.stringify({}),
    }),
  purchase: (
    tenantId: TenantId,
    data: {
      product_id: number;
      customer_name?: string;
      country_code?: string;
      mobile?: string;
    }
  ) =>
    request<ProductPurchaseResponse>("/product/purchase", {
      tenantId,
      method: "POST",
      body: JSON.stringify(data),
    }),
  create: (
    tenantId: TenantId,
    accessToken: string,
    data: {
      product_code: string;
      product_image: string;
      product_price: number;
      display_order?: number;
      translations: { lang_code: string; name: string; description?: string }[];
    }
  ) =>
    request<ProductResponse>("/product", {
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
      product_code?: string;
      product_image?: string;
      product_price?: number;
      display_order?: number;
      translations?: { lang_code: string; name: string; description?: string }[];
    }
  ) =>
    request<ProductResponse>("/product/update", {
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
    request<ProductResponse>("/product/status", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
  remove: (tenantId: TenantId, accessToken: string, data: { id: number }) =>
    request<{ success?: boolean; statusCode?: number; message?: string }>("/product/delete", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
};
