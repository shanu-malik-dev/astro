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

// ---- Payments ----
export const paymentApi = {
  createIntent: (tenantId: TenantId, accessToken: string, bookingId: string) =>
    request<{ clientSecret: string; amount: number; currency: string }>('/payments/create-intent', {
      tenantId, accessToken, method: 'POST', body: JSON.stringify({ bookingId }),
    }),
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
