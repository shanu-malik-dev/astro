import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../auth/entity/user.entity';
import { ServiceTranslationEntity } from '../service/entity/service-translation.entity';
import { ServiceEntity } from '../service/entity/service.entity';
import { EnquiryController } from './controller/enquiry.controller';
import { EnquiryEntity } from './entity/enquiry.entity';
import { EnquiryRepository } from './repository/enquiry.repository';
import { EnquiryService } from './service/enquiry.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EnquiryEntity,
      ServiceEntity,
      ServiceTranslationEntity,
      UserEntity,
    ]),
  ],
  controllers: [EnquiryController],
  providers: [EnquiryService, EnquiryRepository],
})
export class EnquiryModule {}
