export type TenantId = 'US' | 'IN';

export interface TenantMeta {
  id: TenantId;
  country: string;
  currency: string;
  locale: string;
}

export const TENANTS: Record<TenantId, TenantMeta> = {
  US: { id: 'US', country: 'United States', currency: 'USD', locale: 'en-US' },
  IN: { id: 'IN', country: 'India', currency: 'INR', locale: 'en-IN' },
};

export function getTenantFromCookie(cookieValue: string | undefined): TenantMeta {
  const id = (cookieValue?.toUpperCase() as TenantId) || 'US';
  return TENANTS[id] || TENANTS.US;
}

export function formatMoney(amount: number, tenant: TenantMeta): string {
  return new Intl.NumberFormat(tenant.locale, {
    style: 'currency',
    currency: tenant.currency,
  }).format(amount);
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function apiFetch(path: string, tenantId: TenantId, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
      ...options.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}
