import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiLogInterceptor } from './api-log.interceptor';
import { ApiLogService } from './api-log.service';
import { ApiQueryPatcherService } from './api-query-patcher.service';
import { ApiLogEntity } from './entities/api-log.entity';
import { ApiQueryLogEntity } from './entities/api-query-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApiLogEntity, ApiQueryLogEntity])],
  providers: [
    ApiLogService,
    ApiQueryPatcherService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiLogInterceptor,
    },
  ],
})
export class ApiLoggingModule {}
