import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { apiLogStorage, ApiLogStore } from './api-log-context';
import { ApiLogService } from './api-log.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub?: string | number;
    id?: string | number;
  };
};

@Injectable()
export class ApiLogInterceptor implements NestInterceptor {
  constructor(private readonly apiLogService: ApiLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const http = context.switchToHttp();
    const request = http.getRequest<AuthenticatedRequest>();
    const response = http.getResponse<Response>();
    const store: ApiLogStore = {
      requestId: randomUUID(),
      queries: [],
    };
    const startedAt = Date.now();
    let responseBody: unknown;
    let errorMessage: string | null = null;

    return apiLogStorage.run(store, () =>
      next.handle().pipe(
        tap((body) => {
          responseBody = body;
        }),
        catchError((error) => {
          errorMessage = error instanceof Error ? error.message : String(error);
          responseBody = this.getErrorResponse(error);
          return throwError(() => error);
        }),
        tap({
          finalize: () => {
            void this.apiLogService.save({
              store,
              method: request.method,
              path: request.originalUrl || request.url,
              statusCode: response.statusCode || null,
              responseTimeMs: Date.now() - startedAt,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'] || null,
              userId: this.getUserId(request),
              tenantId: this.getTenantId(request),
              requestHeaders: request.headers as Record<string, unknown>,
              requestQuery: request.query as Record<string, unknown>,
              requestBody: request.body,
              responseBody,
              errorMessage,
            });
          },
        }),
      ),
    );
  }

  private getErrorResponse(error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      return (error as { response?: unknown }).response;
    }
    return undefined;
  }

  private getUserId(request: AuthenticatedRequest) {
    const value = request.user?.sub || request.user?.id;
    return value ? Number(value) : null;
  }

  private getTenantId(request: Request) {
    const tenant = request.headers['x-tenant-id'];
    return Array.isArray(tenant) ? tenant[0] : tenant || null;
  }
}
