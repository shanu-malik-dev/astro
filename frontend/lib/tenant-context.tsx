'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { TENANTS, TenantId, TenantMeta, formatMoney } from './tenant';

interface TenantContextValue {
  tenant: TenantMeta;
  setTenantId: (id: TenantId) => void;
  formatMoney: (amount: number) => string;
}

const TenantContext = createContext<TenantContextValue | null>(null);

function readTenantCookie(): TenantId {
  if (typeof document === 'undefined') return 'US';
  const match = document.cookie.match(/(?:^|; )tenant=([^;]*)/);
  const value = match ? decodeURIComponent(match[1]).toUpperCase() : 'US';
  return (value === 'IN' ? 'IN' : 'US') as TenantId;
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantIdState] = useState<TenantId>('US');

  useEffect(() => {
    setTenantIdState(readTenantCookie());
  }, []);

  const setTenantId = (id: TenantId) => {
    document.cookie = `tenant=${id.toLowerCase()}; path=/; max-age=${60 * 60 * 24 * 30}`;
    setTenantIdState(id);
    window.location.reload();
  };

  const value = useMemo<TenantContextValue>(
    () => ({
      tenant: TENANTS[tenantId],
      setTenantId,
      formatMoney: (amount: number) => formatMoney(amount, TENANTS[tenantId]),
    }),
    [tenantId],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}
