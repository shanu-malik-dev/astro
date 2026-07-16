import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceController } from './controller/service.controller';
import { ServiceTranslationEntity } from './entity/service-translation.entity';
import { ServiceEntity } from './entity/service.entity';
import { ServiceRepository } from './repository/service.repository';
import { ServiceService } from './service/service.service';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceEntity, ServiceTranslationEntity])],
  controllers: [ServiceController],
  providers: [ServiceService, ServiceRepository],
  exports: [ServiceService],
})
export class ServiceModule {}
