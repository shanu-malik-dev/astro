import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiLogStore } from './api-log-context';
import { sanitizeForLog, truncateForLog } from './api-log.util';
import { ApiLogEntity } from './entities/api-log.entity';
import { ApiQueryLogEntity } from './entities/api-query-log.entity';

type SaveApiLogInput = {
  store: ApiLogStore;
  method: string;
  path: string;
  statusCode: number | null;
  responseTimeMs: number;
  ipAddress?: string | null;
  userAgent?: string | null;
  userId?: number | null;
  tenantId?: string | null;
  requestHeaders?: Record<string, unknown>;
  requestQuery?: Record<string, unknown>;
  requestBody?: unknown;
  responseBody?: unknown;
  errorMessage?: string | null;
};

@Injectable()
export class ApiLogService {
  constructor(
    @InjectRepository(ApiLogEntity)
    private readonly apiLogRepository: Repository<ApiLogEntity>,
    @InjectRepository(ApiQueryLogEntity)
    private readonly apiQueryLogRepository: Repository<ApiQueryLogEntity>,
  ) {}

  async save(input: SaveApiLogInput) {
    input.store.skipQueryCapture = true;
    try {
      const apiLog = await this.apiLogRepository.save(
        this.apiLogRepository.create({
          request_id: input.store.requestId,
          method: input.method,
          path: input.path,
          status_code: input.statusCode,
          response_time_ms: input.responseTimeMs,
          ip_address: input.ipAddress || null,
          user_agent: input.userAgent || null,
          user_id: input.userId || null,
          tenant_id: input.tenantId || null,
          request_headers: truncateForLog(
            sanitizeForLog(input.requestHeaders),
          ) as Record<string, unknown>,
          request_query: truncateForLog(
            sanitizeForLog(input.requestQuery),
          ) as Record<string, unknown>,
          request_body: truncateForLog(sanitizeForLog(input.requestBody)),
          response_body: truncateForLog(sanitizeForLog(input.responseBody)),
          error_message: input.errorMessage || null,
          query_count: input.store.queries.length,
        }),
      );

      if (input.store.queries.length > 0) {
        await this.apiQueryLogRepository.save(
          input.store.queries.map((query) =>
            this.apiQueryLogRepository.create({
              api_log_id: apiLog.id,
              query_text: query.query,
              query_params: truncateForLog(
                sanitizeForLog(query.parameters || []),
              ) as unknown[],
              query_response: truncateForLog(sanitizeForLog(query.response)),
              error_message: query.error || null,
              response_time_ms: query.responseTimeMs,
              created_at: query.createdAt,
            }),
          ),
        );
      }
    } finally {
      input.store.skipQueryCapture = false;
    }
  }
}
