import { TenantId } from './tenant';
import { apiService, ApiError } from './api-service';

export { ApiError };

interface RequestOptions extends RequestInit {
  tenantId: TenantId;
  accessToken?: string | null;
}

async function request<T>(path: string, { tenantId, accessToken, headers, ...options }: RequestOptions): Promise<T> {
  return apiService<T>(path, {
    ...options,
    headers: {
      'x-tenant-id': tenantId,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });
}

// ---- Types ----
export interface ServiceDto {
  id: string;
  name: string;
  category?: string;
  description?: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
}

export interface TestimonialDto {
  id: string;
  customerName: string;
  customerPhotoUrl?: string;
  message: string;
  rating: number;
  isApproved: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export interface BlogPostDto {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl?: string;
  category?: string;
  tags?: string[];
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

export interface BookingDto {
  id: string;
  customerId: string;
  serviceId: string;
  service?: ServiceDto;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  amountPaid: number;
  googleMeetLink?: string;
  customerNotes?: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  role_id?: number | string;
  fullName: string;
  name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  countryCode?: string;
  country_code?: string;
  role: string;
  isActive: boolean;
}

export interface AuthResponse {
  statusCode?: number;
  message?: string;
  user?: AuthUser;
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  data?: {
    user?: AuthUser;
    accessToken?: string;
    access_token?: string;
    refreshToken?: string;
    refresh_token?: string;
    token?: string;
  };
}

export interface OtpResponse {
  statusCode?: number;
  message?: string;
  success?: boolean;
  otp_expires_at?: string;
  otp_expires_in?: string | number;
  data?: {
    country_code?: string;
    mobile?: string;
    otp_expires_at?: string;
    otp_expires_in?: string | number;
  };
}

export interface ProblemNameDto {
  label: string;
  value: string;
}

export interface ProblemDto {
  id: number;
  name: string;
  status: number;
  display_order: number;
  all_names: ProblemNameDto[];
}

export interface ProblemListResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: {
    records: ProblemDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  };
}

export interface ProblemResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: ProblemDto | null;
}

export interface ProblemDropdownOptionDto {
  value: number;
  en_label: string;
  hi_label: string;
}

export interface ProblemDropdownResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: ProblemDropdownOptionDto[];
}

export interface ServiceNameDto {
  label: string;
  value: string;
  expertise?: string;
  description?: string;
}

export interface AdminServiceDto {
  id: number;
  name: string;
  description: string;
  status: number;
  display_order: number;
  all_names: ServiceNameDto[];
}

export interface AdminServiceListResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: {
    records: AdminServiceDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  };
}

export interface AdminServiceResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: AdminServiceDto | null;
}

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

export interface EnquiryDto {
  id: number;
  customer_id?: number | null;
  customer_name: string;
  country_code: string;
  mobile: string;
  customer_mobile: string;
  problem_id: number;
  problem_name: string;
  status: "open" | "closed";
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
  payment_status: "created" | "pending" | "paid" | "failed" | "cancelled" | "expired";
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

export interface CustomerDto {
  id: number;
  name: string;
  country_code: string;
  mobile: string;
  customer_mobile: string;
  status: number;
  call_status: "called" | "not_called";
  created_at?: string;
  updated_at?: string;
}

export interface CustomerListResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: {
    records: CustomerDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  };
}

export interface CustomerResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: CustomerDto | null;
}

export interface FollowUpDto {
  id: number;
  enq_id: number;
  customer_name: string;
  country_code: string;
  mobile: string;
  customer_mobile: string;
  problem_name: string;
  remark: string;
  status: "hot" | "warm" | "cold";
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

// ---- Auth ----
export const authApi = {
  signup: (tenantId: TenantId, data: { fullName: string; countryCode: string; mobile: string }) =>
    request<OtpResponse>('/auth/signup', {
      tenantId,
      method: 'POST',
      body: JSON.stringify({
        name: data.fullName,
        country_code: data.countryCode,
        mobile: data.mobile,
      }),
    }),
  register: (tenantId: TenantId, data: { fullName: string; countryCode: string; mobile: string }) =>
    request<OtpResponse>('/auth/signup', {
      tenantId,
      method: 'POST',
      body: JSON.stringify({
        name: data.fullName,
        country_code: data.countryCode,
        mobile: data.mobile,
      }),
    }),
  login: (tenantId: TenantId, data: { countryCode: string; mobile: string }) =>
    request<OtpResponse>('/auth/login', {
      tenantId,
      method: 'POST',
      body: JSON.stringify({
        country_code: data.countryCode,
        mobile: data.mobile,
      }),
    }),
  verifyOtp: (tenantId: TenantId, data: { countryCode: string; mobile: string; otp: string }) =>
    request<AuthResponse>('/auth/verify-otp', {
      tenantId,
      method: 'POST',
      body: JSON.stringify({
        country_code: data.countryCode,
        mobile: data.mobile,
        otp: data.otp,
      }),
    }),
  resendOtp: (tenantId: TenantId, data: { countryCode: string; mobile: string }) =>
    request<OtpResponse>('/auth/resend-otp', {
      tenantId,
      method: 'POST',
      body: JSON.stringify({
        country_code: data.countryCode,
        mobile: data.mobile,
      }),
    }),
  refresh: (tenantId: TenantId, refreshToken: string) =>
    request<AuthResponse>('/auth/refresh', { tenantId, method: 'POST', body: JSON.stringify({ refreshToken }) }),
  logout: (tenantId: TenantId, accessToken: string) =>
    request<{ success: boolean }>('/auth/logout', { tenantId, accessToken, method: 'POST' }),
  me: (tenantId: TenantId, accessToken: string) =>
    request<AuthUser>('/auth/me', { tenantId, accessToken, method: 'GET' }),
};

// ---- Problem ----
export const problemApi = {
  dropdown: (tenantId: TenantId) =>
    request<ProblemDropdownResponse>('/problem/dropdown', {
      tenantId,
      method: 'POST',
      body: JSON.stringify({}),
    }),
  list: (
    tenantId: TenantId,
    accessToken: string,
    data: { page?: number; limit?: number; status?: number; search?: string }
  ) =>
    request<ProblemListResponse>('/problem/list', {
      tenantId,
      accessToken,
      method: 'POST',
      body: JSON.stringify(data),
    }),
  create: (
    tenantId: TenantId,
    accessToken: string,
    data: {
      display_order?: number;
      translations: { lang_code: string; name: string }[];
    }
  ) =>
    request<ProblemResponse>('/problem', {
      tenantId,
      accessToken,
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (
    tenantId: TenantId,
    accessToken: string,
    data: {
      id: number;
      display_order?: number;
      translations?: { lang_code: string; name: string }[];
    }
  ) =>
    request<ProblemResponse>('/problem/update', {
      tenantId,
      accessToken,
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStatus: (
    tenantId: TenantId,
    accessToken: string,
    data: { id: number; status: number }
  ) =>
    request<ProblemResponse>('/problem/status', {
      tenantId,
      accessToken,
      method: 'POST',
      body: JSON.stringify(data),
    }),
  remove: (tenantId: TenantId, accessToken: string, data: { id: number }) =>
    request<{ success?: boolean; statusCode?: number; message?: string }>('/problem/delete', {
      tenantId,
      accessToken,
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

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
    request<EnquiryResponse>('/enquiry', {
      tenantId,
      method: 'POST',
      body: JSON.stringify(data),
    }),
  list: (
    tenantId: TenantId,
    accessToken: string,
    data: {
      page?: number;
      limit?: number;
      status?: "open" | "closed";
      search?: string;
      date_from?: string;
      date_to?: string;
    }
  ) =>
    request<EnquiryListResponse>('/enquiry/list', {
      tenantId,
      accessToken,
      method: 'POST',
      body: JSON.stringify(data),
    }),
  close: (
    tenantId: TenantId,
    accessToken: string,
    data: { id: number; remark: string }
  ) =>
    request<EnquiryResponse>('/enquiry/close', {
      tenantId,
      accessToken,
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const followUpApi = {
  create: (
    tenantId: TenantId,
    accessToken: string,
    data: { enq_id: number; status: "hot" | "warm" | "cold"; remark: string }
  ) =>
    request<FollowUpResponse>('/follow-up', {
      tenantId,
      accessToken,
      method: 'POST',
      body: JSON.stringify(data),
    }),
  list: (
    tenantId: TenantId,
    accessToken: string,
    data: {
      page?: number;
      limit?: number;
      status?: "hot" | "warm" | "cold";
      search?: string;
      date_from?: string;
      date_to?: string;
    }
  ) =>
    request<FollowUpListResponse>('/follow-up/list', {
      tenantId,
      accessToken,
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const paymentApi = {
  createIntent: (tenantId: TenantId, accessToken: string, bookingId: string) =>
    request<{ clientSecret: string; amount: number; currency: string }>('/payments/create-intent', {
      tenantId, accessToken, method: 'POST', body: JSON.stringify({ bookingId }),
    }),
  generateLink: (
    tenantId: TenantId,
    accessToken: string,
    data: { enq_id: number; amount: number; currency?: string }
  ) =>
    request<CustomerPaymentResponse>('/payments/generate-link', {
      tenantId,
      accessToken,
      method: 'POST',
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
    }
  ) =>
    request<CustomerPaymentListResponse>('/payments/list', {
      tenantId,
      accessToken,
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const customerApi = {
  list: (
    tenantId: TenantId,
    accessToken: string,
    data: {
      page?: number;
      limit?: number;
      search?: string;
      range?: "today" | "all";
      call_status?: CustomerDto["call_status"];
    }
  ) =>
    request<CustomerListResponse>('/customer/list', {
      tenantId,
      accessToken,
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCallStatus: (
    tenantId: TenantId,
    accessToken: string,
    data: { id: number; call_status: CustomerDto["call_status"] }
  ) =>
    request<CustomerResponse>('/customer/call-status', {
      tenantId,
      accessToken,
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const adminServiceApi = {
  list: (
    tenantId: TenantId,
    accessToken: string,
    data: { page?: number; limit?: number; status?: number; search?: string }
  ) =>
    request<AdminServiceListResponse>('/service/list', {
      tenantId,
      accessToken,
      method: 'POST',
      body: JSON.stringify(data),
    }),
  create: (
    tenantId: TenantId,
    accessToken: string,
    data: {
      display_order?: number;
      translations: { lang_code: string; name: string; description?: string }[];
    }
  ) =>
    request<AdminServiceResponse>('/service', {
      tenantId,
      accessToken,
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (
    tenantId: TenantId,
    accessToken: string,
    data: {
      id: number;
      display_order?: number;
      translations?: { lang_code: string; name: string; description?: string }[];
    }
  ) =>
    request<AdminServiceResponse>('/service/update', {
      tenantId,
      accessToken,
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStatus: (
    tenantId: TenantId,
    accessToken: string,
    data: { id: number; status: number }
  ) =>
    request<AdminServiceResponse>('/service/status', {
      tenantId,
      accessToken,
      method: 'POST',
      body: JSON.stringify(data),
    }),
  remove: (tenantId: TenantId, accessToken: string, data: { id: number }) =>
    request<{ success?: boolean; statusCode?: number; message?: string }>('/service/delete', {
      tenantId,
      accessToken,
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const adminAstrologerApi = {
  list: (
    tenantId: TenantId,
    accessToken: string,
    data: { page?: number; limit?: number; status?: number; search?: string }
  ) =>
    request<AdminAstrologerListResponse>('/astrologer/list', {
      tenantId,
      accessToken,
      method: 'POST',
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
    request<AdminAstrologerResponse>('/astrologer', {
      tenantId,
      accessToken,
      method: 'POST',
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
    request<AdminAstrologerResponse>('/astrologer/update', {
      tenantId,
      accessToken,
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStatus: (
    tenantId: TenantId,
    accessToken: string,
    data: { id: number; status: number }
  ) =>
    request<AdminAstrologerResponse>('/astrologer/status', {
      tenantId,
      accessToken,
      method: 'POST',
      body: JSON.stringify(data),
    }),
  remove: (tenantId: TenantId, accessToken: string, data: { id: number }) =>
    request<{ success?: boolean; statusCode?: number; message?: string }>('/astrologer/delete', {
      tenantId,
      accessToken,
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const astrologerApi = {
  listPublic: (
    tenantId: TenantId,
    data: { page?: number; limit?: number; search?: string }
  ) =>
    request<PublicAstrologerListResponse>('/astrologer/public-list', {
      tenantId,
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ---- Services ----
export const servicesApi = {
  listPublic: (tenantId: TenantId) => request<ServiceDto[]>('/services', { tenantId, method: 'GET' }),
  get: (tenantId: TenantId, id: string) => request<ServiceDto>(`/services/${id}`, { tenantId, method: 'GET' }),
  listAdmin: (tenantId: TenantId, accessToken: string) =>
    request<ServiceDto[]>('/services/admin/all', { tenantId, accessToken, method: 'GET' }),
  create: (tenantId: TenantId, accessToken: string, data: Partial<ServiceDto>) =>
    request<ServiceDto>('/services', { tenantId, accessToken, method: 'POST', body: JSON.stringify(data) }),
  update: (tenantId: TenantId, accessToken: string, id: string, data: Partial<ServiceDto>) =>
    request<ServiceDto>(`/services/${id}`, { tenantId, accessToken, method: 'PATCH', body: JSON.stringify(data) }),
  remove: (tenantId: TenantId, accessToken: string, id: string) =>
    request<ServiceDto>(`/services/${id}`, { tenantId, accessToken, method: 'DELETE' }),
};

// ---- Testimonials ----
export const testimonialsApi = {
  listApproved: (tenantId: TenantId) => request<TestimonialDto[]>('/testimonials', { tenantId, method: 'GET' }),
  submit: (tenantId: TenantId, data: { customerName: string; message: string; rating: number; customerPhotoUrl?: string }) =>
    request<TestimonialDto>('/testimonials', { tenantId, method: 'POST', body: JSON.stringify(data) }),
  listAdmin: (tenantId: TenantId, accessToken: string) =>
    request<TestimonialDto[]>('/testimonials/admin/all', { tenantId, accessToken, method: 'GET' }),
  approve: (tenantId: TenantId, accessToken: string, id: string) =>
    request<TestimonialDto>(`/testimonials/${id}/approve`, { tenantId, accessToken, method: 'PATCH' }),
  setFeatured: (tenantId: TenantId, accessToken: string, id: string, isFeatured: boolean) =>
    request<TestimonialDto>(`/testimonials/${id}/featured`, {
      tenantId, accessToken, method: 'PATCH', body: JSON.stringify({ isFeatured }),
    }),
  remove: (tenantId: TenantId, accessToken: string, id: string) =>
    request<{ success: boolean }>(`/testimonials/${id}`, { tenantId, accessToken, method: 'DELETE' }),
};

// ---- Blog ----
export const blogApi = {
  listPublished: (tenantId: TenantId) => request<BlogPostDto[]>('/blog', { tenantId, method: 'GET' }),
  getBySlug: (tenantId: TenantId, slug: string) => request<BlogPostDto>(`/blog/slug/${slug}`, { tenantId, method: 'GET' }),
  listAdmin: (tenantId: TenantId, accessToken: string) =>
    request<BlogPostDto[]>('/blog/admin/all', { tenantId, accessToken, method: 'GET' }),
  create: (tenantId: TenantId, accessToken: string, data: Partial<BlogPostDto>) =>
    request<BlogPostDto>('/blog', { tenantId, accessToken, method: 'POST', body: JSON.stringify(data) }),
  update: (tenantId: TenantId, accessToken: string, id: string, data: Partial<BlogPostDto>) =>
    request<BlogPostDto>(`/blog/${id}`, { tenantId, accessToken, method: 'PATCH', body: JSON.stringify(data) }),
  remove: (tenantId: TenantId, accessToken: string, id: string) =>
    request<{ success: boolean }>(`/blog/${id}`, { tenantId, accessToken, method: 'DELETE' }),
};

// ---- Bookings ----
export const bookingApi = {
  create: (tenantId: TenantId, accessToken: string, data: { serviceId: string; scheduledAt: string; customerNotes?: string }) =>
    request<BookingDto>('/bookings', { tenantId, accessToken, method: 'POST', body: JSON.stringify(data) }),
  mine: (tenantId: TenantId, accessToken: string) =>
    request<BookingDto[]>('/bookings/mine', { tenantId, accessToken, method: 'GET' }),
  listAdmin: (tenantId: TenantId, accessToken: string, from?: string, to?: string) => {
    const qs = from && to ? `?from=${from}&to=${to}` : '';
    return request<BookingDto[]>(`/bookings${qs}`, { tenantId, accessToken, method: 'GET' });
  },
  get: (tenantId: TenantId, accessToken: string, id: string) =>
    request<BookingDto>(`/bookings/${id}`, { tenantId, accessToken, method: 'GET' }),
  reschedule: (tenantId: TenantId, accessToken: string, id: string, scheduledAt: string) =>
    request<BookingDto>(`/bookings/${id}/reschedule`, {
      tenantId, accessToken, method: 'PATCH', body: JSON.stringify({ scheduledAt }),
    }),
  cancel: (tenantId: TenantId, accessToken: string, id: string) =>
    request<BookingDto>(`/bookings/${id}/cancel`, { tenantId, accessToken, method: 'PATCH' }),
  complete: (tenantId: TenantId, accessToken: string, id: string) =>
    request<BookingDto>(`/bookings/${id}/complete`, { tenantId, accessToken, method: 'PATCH' }),
};

// ---- CRM (admin only) ----
export interface CrmLeadDto {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  stage: string;
  tags?: string[];
  source?: string;
  updatedAt: string;
  createdAt: string;
}

export const crmApi = {
  listAll: (tenantId: TenantId, accessToken: string, stage?: string) =>
    request<CrmLeadDto[]>(`/crm/leads${stage ? `?stage=${stage}` : ''}`, { tenantId, accessToken, method: 'GET' }),
  get: (tenantId: TenantId, accessToken: string, id: string) =>
    request<CrmLeadDto & { activities: { id: string; type: string; note: string; createdAt: string }[] }>(
      `/crm/leads/${id}`, { tenantId, accessToken, method: 'GET' },
    ),
  updateStage: (tenantId: TenantId, accessToken: string, id: string, stage: string) =>
    request<CrmLeadDto>(`/crm/leads/${id}/stage`, { tenantId, accessToken, method: 'PATCH', body: JSON.stringify({ stage }) }),
  addNote: (tenantId: TenantId, accessToken: string, id: string, note: string) =>
    request(`/crm/leads/${id}/notes`, { tenantId, accessToken, method: 'POST', body: JSON.stringify({ note }) }),
  addTags: (tenantId: TenantId, accessToken: string, id: string, tags: string[]) =>
    request<CrmLeadDto>(`/crm/leads/${id}/tags`, { tenantId, accessToken, method: 'PATCH', body: JSON.stringify({ tags }) }),
};

// ---- Dashboard (admin only) ----
export interface DashboardOverviewDto {
  revenue: { total: number; thisMonth: number };
  bookings: { total: number; confirmed: number; completed: number; cancelled: number };
  customers: { total: number };
  leadsByStage: { stage: string; count: string }[];
  upcomingBookings: BookingDto[];
}

export const dashboardApi = {
  overview: (tenantId: TenantId, accessToken: string) =>
    request<DashboardOverviewDto>('/dashboard/overview', { tenantId, accessToken, method: 'GET' }),
  calendar: (tenantId: TenantId, accessToken: string, from: string, to: string) =>
    request<BookingDto[]>(`/dashboard/calendar?from=${from}&to=${to}`, { tenantId, accessToken, method: 'GET' }),
};

// ---- Settings ----
export const settingsApi = {
  website: (tenantId: TenantId) => request<Record<string, string | null>>('/settings/website', { tenantId, method: 'GET' }),
  all: (tenantId: TenantId, accessToken: string) =>
    request<Record<string, string>>('/settings/all', { tenantId, accessToken, method: 'GET' }),
  update: (tenantId: TenantId, accessToken: string, entries: Record<string, string>) =>
    request('/settings', { tenantId, accessToken, method: 'PATCH', body: JSON.stringify(entries) }),
};
