import { AsyncLocalStorage } from 'async_hooks';

export type ApiQueryLogItem = {
  query: string;
  parameters?: unknown[];
  response?: unknown;
  error?: string;
  responseTimeMs: number;
  createdAt: Date;
};

export type ApiLogStore = {
  requestId: string;
  queries: ApiQueryLogItem[];
  skipQueryCapture?: boolean;
};

export const apiLogStorage = new AsyncLocalStorage<ApiLogStore>();
