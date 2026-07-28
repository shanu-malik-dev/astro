import { BadRequestException, Injectable } from '@nestjs/common';
import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

@Injectable()
export class ThirdPartyHttpService {
  async request<T = Record<string, unknown>>(
    config: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    try {
      return await axios.request<T>({
        timeout: 30000,
        ...config,
      });
    } catch (error) {
      if (this.isAxiosError(error)) {
        const data = error.response?.data;
        throw new BadRequestException({
          message: this.getProviderError(data, 'Third-party request failed.'),
          error: data || error.message,
        });
      }

      throw error;
    }
  }

  get<T = Record<string, unknown>>(
    url: string,
    config?: Omit<AxiosRequestConfig, 'url' | 'method'>,
  ) {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  post<T = Record<string, unknown>>(
    url: string,
    data?: unknown,
    config?: Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>,
  ) {
    return this.request<T>({ ...config, url, data, method: 'POST' });
  }

  private isAxiosError(error: unknown): error is AxiosError {
    return axios.isAxiosError(error);
  }

  private getProviderError(data: unknown, fallback: string) {
    if (!data || typeof data !== 'object') return fallback;

    const response = data as Record<string, unknown>;
    const providerError = response.error as
      | { description?: string; message?: string }
      | undefined;

    return (
      providerError?.description ||
      providerError?.message ||
      (typeof response.message === 'string' ? response.message : fallback)
    );
  }
}
