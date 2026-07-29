import { request, type TenantId } from "../shared";

export interface CustomerPaymentDto {
  id: number;
  enq_id?: number | null;
  customer_name: string;
  country_code: string;
  customer_mobile: string;
  amount: number;
  currency: string;
  provider: "razorpay" | "stripe";
  provider_payment_id?: string | null;
  payment_link?: string | null;
  qr_code_url?: string | null;
  payment_status: number;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerPaymentListResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: {
    records: CustomerPaymentDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  };
}

export interface CustomerPaymentResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: CustomerPaymentDto | null;
}

export const paymentApi = {
  generateLink: (
    tenantId: TenantId,
    accessToken: string,
    data: { enq_id: number; amount: number; currency?: string }
  ) =>
    request<CustomerPaymentResponse>("/payments/generate-link", {
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
      search?: string;
      provider?: "razorpay" | "stripe";
      payment_status?: CustomerPaymentDto["payment_status"];
      date_from?: string;
      date_to?: string;
    }
  ) =>
    request<CustomerPaymentListResponse>("/payments/list", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
};
