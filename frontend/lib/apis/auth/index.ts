import { request, type TenantId } from "../shared";

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
  admin_modules?: string[];
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

export const authApi = {
  register: (tenantId: TenantId, data: { fullName: string; countryCode: string; mobile: string }) =>
    request<OtpResponse>("/auth/signup", {
      tenantId,
      method: "POST",
      body: JSON.stringify({
        name: data.fullName,
        country_code: data.countryCode,
        mobile: data.mobile,
      }),
    }),
  login: (tenantId: TenantId, data: { countryCode: string; mobile: string }) =>
    request<OtpResponse>("/auth/login", {
      tenantId,
      method: "POST",
      body: JSON.stringify({
        country_code: data.countryCode,
        mobile: data.mobile,
      }),
    }),
  adminEmailLogin: (tenantId: TenantId, data: { email: string; password: string }) =>
    request<AuthResponse>("/auth/admin/email-login", {
      tenantId,
      method: "POST",
      body: JSON.stringify(data),
    }),
  sendForgotPasswordOtp: (tenantId: TenantId, data: { email: string }) =>
    request<OtpResponse>("/auth/forgot-password/send-otp", {
      tenantId,
      method: "POST",
      body: JSON.stringify(data),
    }),
  resetForgotPassword: (
    tenantId: TenantId,
    data: {
      email: string;
      otp: string;
      password: string;
      confirm_password: string;
    }
  ) =>
    request<{ statusCode?: number; message?: string }>("/auth/forgot-password/reset", {
      tenantId,
      method: "POST",
      body: JSON.stringify(data),
    }),
  verifyOtp: (tenantId: TenantId, data: { countryCode: string; mobile: string; otp: string }) =>
    request<AuthResponse>("/auth/verify-otp", {
      tenantId,
      method: "POST",
      body: JSON.stringify({
        country_code: data.countryCode,
        mobile: data.mobile,
        otp: data.otp,
      }),
    }),
  resendOtp: (tenantId: TenantId, data: { countryCode: string; mobile: string }) =>
    request<OtpResponse>("/auth/resend-otp", {
      tenantId,
      method: "POST",
      body: JSON.stringify({
        country_code: data.countryCode,
        mobile: data.mobile,
      }),
    }),
  logout: (tenantId: TenantId, accessToken: string) =>
    request<{ success: boolean }>("/auth/logout", {
      tenantId,
      accessToken,
      method: "POST",
    }),
  me: (tenantId: TenantId, accessToken: string) =>
    request<AuthResponse>("/auth/me", {
      tenantId,
      accessToken,
      method: "POST",
    }),
};
