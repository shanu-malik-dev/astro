import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AstrologerStatusController } from './controller/astrologer-status.controller';
import { AstrologerStatusEntity } from './entity/astrologer-status.entity';
import { AstrologerStatusService } from './service/astrologer-status.service';

@Module({
  imports: [TypeOrmModule.forFeature([AstrologerStatusEntity])],
  controllers: [AstrologerStatusController],
  providers: [AstrologerStatusService],
  exports: [AstrologerStatusService],
})
export class AstrologerStatusModule {}
