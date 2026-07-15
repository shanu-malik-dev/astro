'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { authApi, AuthUser, ApiError } from './api';
import { useTenant } from './tenant-context';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthContextValue extends AuthState {
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: { fullName: string; email: string; password: string; phone?: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const STORAGE_KEY = 'astronova_session';

const AuthContext = createContext<AuthContextValue | null>(null);

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

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(tenant.id, { email, password });
    persist({ user: res.user, accessToken: res.accessToken, refreshToken: res.refreshToken });
    return res.user;
  }, [tenant.id]);

  const register = useCallback(async (data: { fullName: string; email: string; password: string; phone?: string }) => {
    const res = await authApi.register(tenant.id, data);
    persist({ user: res.user, accessToken: res.accessToken, refreshToken: res.refreshToken });
    return res.user;
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
    <AuthContext.Provider value={{ ...state, loading, login, register, logout }}>
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
