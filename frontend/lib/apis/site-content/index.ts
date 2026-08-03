import { request, type TenantId } from "../shared";

export type SiteContentValues = Record<string, string>;

export interface SiteContentResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: SiteContentValues;
}

export const siteContentApi = {
  public: (tenantId: TenantId) =>
    request<SiteContentResponse>("/site-content/public", {
      tenantId,
      method: "GET",
    }),
  admin: (tenantId: TenantId, accessToken: string) =>
    request<SiteContentResponse>("/site-content/admin", {
      tenantId,
      accessToken,
      method: "GET",
    }),
  save: (
    tenantId: TenantId,
    accessToken: string,
    values: SiteContentValues
  ) =>
    request<SiteContentResponse>("/site-content/save", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify({ values }),
    }),
};
