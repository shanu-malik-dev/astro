import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { apiLogStorage } from './api-log-context';
import { compactQueryResult, sanitizeForLog, truncateForLog } from './api-log.util';

@Injectable()
export class ApiQueryPatcherService implements OnApplicationBootstrap {
  private patched = false;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  onApplicationBootstrap() {
    if (this.patched) return;
    this.patched = true;

    const originalCreateQueryRunner = this.dataSource.createQueryRunner.bind(
      this.dataSource,
    );

    this.dataSource.createQueryRunner = (...args) => {
      const queryRunner = originalCreateQueryRunner(...args);
      const originalQuery = queryRunner.query.bind(queryRunner);

      queryRunner.query = async (query: string, parameters?: unknown[], ...rest: unknown[]) => {
        const store = apiLogStorage.getStore();
        const shouldCapture =
          store &&
          !store.skipQueryCapture &&
          !this.isApiLogQuery(query);
        const startedAt = Date.now();

        try {
          const result = await originalQuery(query, parameters as never, ...(rest as never[]));
          if (shouldCapture) {
            store.queries.push({
              query,
              parameters: sanitizeForLog(parameters) as unknown[],
              response: truncateForLog(compactQueryResult(result)),
              responseTimeMs: Date.now() - startedAt,
              createdAt: new Date(),
            });
          }
          return result;
        } catch (error) {
          if (shouldCapture) {
            store.queries.push({
              query,
              parameters: sanitizeForLog(parameters) as unknown[],
              error: error instanceof Error ? error.message : String(error),
              responseTimeMs: Date.now() - startedAt,
              createdAt: new Date(),
            });
          }
          throw error;
        }
      };

      return queryRunner;
    };
  }

  private isApiLogQuery(query: string) {
    const normalized = query.toLowerCase();
    return normalized.includes('api_logs') || normalized.includes('api_query_logs');
  }
}
