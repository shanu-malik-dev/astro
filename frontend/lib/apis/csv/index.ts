import { API_BASE_URL } from "@/lib/api-service";
import { request, type TenantId } from "../shared";

export interface CsvColumn {
  key: string;
  header: string;
}

export interface CsvExportFile {
  file_id: string;
  file_name: string;
  download_url: string;
}

export interface CsvExportResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: CsvExportFile;
}

function getAcceptLanguage() {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem("astronova_language") || "en";
}

function resolveDownloadUrl(downloadUrl: string) {
  if (/^https?:\/\//i.test(downloadUrl)) return downloadUrl;
  return `${API_BASE_URL}${downloadUrl}`;
}

export const csvApi = {
  create: (
    tenantId: TenantId,
    accessToken: string,
    data: {
      filename?: string;
      columns: CsvColumn[];
      rows: Record<string, unknown>[];
    }
  ) =>
    request<CsvExportResponse>("/csv", {
      tenantId,
      accessToken,
      method: "POST",
      body: JSON.stringify(data),
    }),
  download: async (
    tenantId: TenantId,
    accessToken: string,
    file: CsvExportFile
  ) => {
    const response = await fetch(resolveDownloadUrl(file.download_url), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": getAcceptLanguage(),
        "x-tenant-id": tenantId,
      },
    });

    if (!response.ok) {
      throw new Error(`CSV download failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = objectUrl;
    anchor.download = file.file_name || "export.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(objectUrl);
  },
};
