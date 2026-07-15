import { NextRequest, NextResponse } from 'next/server';

const TENANTS: Record<string, { country: string; currency: string; locale: string }> = {
  us: { country: 'United States', currency: 'USD', locale: 'en-US' },
  in: { country: 'India', currency: 'INR', locale: 'en-IN' },
};

const DEFAULT_TENANT = 'us';

function resolveTenantId(host: string): string {
  const clean = host.split(':')[0].toLowerCase();
  const subdomain = clean.split('.')[0];
  if (TENANTS[subdomain]) return subdomain;
  return DEFAULT_TENANT;
}

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const cookieTenant = req.cookies.get('tenant')?.value;
  const tenantId = cookieTenant && TENANTS[cookieTenant] ? cookieTenant : resolveTenantId(host);

  const res = NextResponse.next();
  res.headers.set('x-tenant-id', tenantId.toUpperCase());
  res.cookies.set('tenant', tenantId, { path: '/', maxAge: 60 * 60 * 24 * 30 });
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
