'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
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
  register: (data: { fullName: string; countryCode: string; mobile: string }) => Promise<OtpResponse>;
  verifyOtp: (data: { countryCode: string; mobile: string; otp: string }) => Promise<AuthUser>;
  resendOtp: (data: { countryCode: string; mobile: string }) => Promise<OtpResponse>;
  logout: () => Promise<void>;
}

const STORAGE_KEY = 'astronova_session';

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
  const [state, setState] = useState<AuthState>({ user: null, accessToken: null, refreshToken: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      try {
        setState(JSON.parse(raw));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const persist = (next: AuthState) => {
    setState(next);
    if (next.user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      persist({ user: null, accessToken: null, refreshToken: null });
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);

    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (data: { countryCode: string; mobile: string }) => {
    return authApi.login(tenant.id, data);
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

  const logout = useCallback(async () => {
    try {
      if (state.accessToken) await authApi.logout(tenant.id, state.accessToken);
    } catch {
      // ignore network/auth errors on logout
    }
    persist({ user: null, accessToken: null, refreshToken: null });
  }, [state.accessToken, tenant.id]);

  return (
    <AuthContext.Provider value={{ ...state, loading, login, register, verifyOtp, resendOtp, logout }}>
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
