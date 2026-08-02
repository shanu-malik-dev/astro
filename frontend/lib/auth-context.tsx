'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { authApi, AuthUser, ApiError, OtpResponse } from './api';
import { AUTH_UNAUTHORIZED_EVENT } from './api-service';
import { useTenant } from './tenant-context';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthContextValue extends AuthState {
  loading: boolean;
  login: (data: { countryCode: string; mobile: string }) => Promise<OtpResponse>;
  adminEmailLogin: (data: { email: string; password: string }) => Promise<AuthUser>;
  sendForgotPasswordOtp: (data: { email: string }) => Promise<OtpResponse>;
  resetForgotPassword: (data: {
    email: string;
    otp: string;
    password: string;
    confirm_password: string;
  }) => Promise<{ statusCode?: number; message?: string }>;
  register: (data: { fullName: string; countryCode: string; mobile: string }) => Promise<OtpResponse>;
  verifyOtp: (data: { countryCode: string; mobile: string; otp: string }) => Promise<AuthUser>;
  resendOtp: (data: { countryCode: string; mobile: string }) => Promise<OtpResponse>;
  syncCurrentUser: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
}

const STORAGE_KEYS = {
  admin: 'astronova_admin_session',
  website: 'astronova_website_session',
} as const;
const LEGACY_STORAGE_KEY = 'astronova_session';

const AuthContext = createContext<AuthContextValue | null>(null);

function getAuthSession(res: Awaited<ReturnType<typeof authApi.verifyOtp>>): AuthState {
  if (typeof res.statusCode === 'number' && res.statusCode !== 200) {
    throw new ApiError(res.statusCode, res.message || 'Unable to verify OTP.');
  }

  const user = res.user || res.data?.user;
  const accessToken =
    res.accessToken ||
    res.access_token ||
    res.data?.accessToken ||
    res.data?.access_token ||
    res.data?.token ||
    null;
  const refreshToken =
    res.refreshToken ||
    res.refresh_token ||
    res.data?.refreshToken ||
    res.data?.refresh_token ||
    null;

  if (!user || !accessToken) {
    throw new ApiError(200, res.message || 'OTP verified, but login session was not returned.');
  }

  return {
    user: {
      ...user,
      fullName: user.fullName || user.name || '',
    },
    accessToken,
    refreshToken,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { tenant } = useTenant();
  const pathname = usePathname();
  const sessionScope = pathname?.startsWith('/admin') ? 'admin' : 'website';
  const storageKey = STORAGE_KEYS[sessionScope];
  const [state, setState] = useState<AuthState>({ user: null, accessToken: null, refreshToken: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }

    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
    if (raw) {
      try {
        setState(JSON.parse(raw));
      } catch {
        window.localStorage.removeItem(storageKey);
        setState({ user: null, accessToken: null, refreshToken: null });
      }
    } else {
      setState({ user: null, accessToken: null, refreshToken: null });
    }
    setLoading(false);
  }, [storageKey]);

  const persist = useCallback((next: AuthState) => {
    setState(next);
    if (next.user) {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    const handleUnauthorized = () => {
      persist({ user: null, accessToken: null, refreshToken: null });
    };
    const handleTokenRefreshed = (event: Event) => {
      const detail = (event as CustomEvent<{
        storageKey?: string;
        session?: AuthState;
      }>).detail;

      if (detail?.storageKey === storageKey && detail.session) {
        setState(detail.session);
      }
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    window.addEventListener("astronova:token-refreshed", handleTokenRefreshed);

    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
      window.removeEventListener("astronova:token-refreshed", handleTokenRefreshed);
    };
  }, [persist, storageKey]);

  const login = useCallback(async (data: { countryCode: string; mobile: string }) => {
    return authApi.login(tenant.id, data);
  }, [tenant.id]);

  const adminEmailLogin = useCallback(async (data: { email: string; password: string }) => {
    const res = await authApi.adminEmailLogin(tenant.id, data);
    const session = getAuthSession(res);
    persist(session);
    return session.user!;
  }, [tenant.id]);

  const sendForgotPasswordOtp = useCallback(async (data: { email: string }) => {
    return authApi.sendForgotPasswordOtp(tenant.id, data);
  }, [tenant.id]);

  const resetForgotPassword = useCallback(async (data: {
    email: string;
    otp: string;
    password: string;
    confirm_password: string;
  }) => {
    return authApi.resetForgotPassword(tenant.id, data);
  }, [tenant.id]);

  const register = useCallback(async (data: { fullName: string; countryCode: string; mobile: string }) => {
    return authApi.register(tenant.id, data);
  }, [tenant.id]);

  const verifyOtp = useCallback(async (data: { countryCode: string; mobile: string; otp: string }) => {
    const res = await authApi.verifyOtp(tenant.id, data);
    const session = getAuthSession(res);
    persist(session);
    return session.user!;
  }, [tenant.id]);

  const resendOtp = useCallback(async (data: { countryCode: string; mobile: string }) => {
    return authApi.resendOtp(tenant.id, data);
  }, [tenant.id]);

  const syncCurrentUser = useCallback(async () => {
    if (!state.accessToken) return null;

    const res = await authApi.me(tenant.id, state.accessToken);
    const nextUser = res.user || res.data?.user || null;
    if (!nextUser) return null;

    const normalizedUser = {
      ...nextUser,
      fullName: nextUser.fullName || nextUser.name || "",
    };

    persist({
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      user: normalizedUser,
    });

    return normalizedUser;
  }, [persist, state.accessToken, state.refreshToken, tenant.id]);

  const logout = useCallback(async () => {
    try {
      if (state.accessToken) await authApi.logout(tenant.id, state.accessToken);
    } catch {
      // ignore network/auth errors on logout
    }
    persist({ user: null, accessToken: null, refreshToken: null });
  }, [state.accessToken, tenant.id]);

  return (
    <AuthContext.Provider value={{ ...state, loading, login, adminEmailLogin, sendForgotPasswordOtp, resetForgotPassword, register, verifyOtp, resendOtp, syncCurrentUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ApiError };
