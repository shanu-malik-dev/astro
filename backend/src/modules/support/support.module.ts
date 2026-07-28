import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportController } from './controller/support.controller';
import { SupportRequestEntity } from './entity/support-request.entity';
import { SupportRepository } from './repository/support.repository';
import { SupportService } from './service/support.service';

@Module({
  imports: [TypeOrmModule.forFeature([SupportRequestEntity])],
  controllers: [SupportController],
  providers: [SupportService, SupportRepository],
})
export class SupportModule {}
