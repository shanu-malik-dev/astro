import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AstrologerConsultCountEntity } from '../astrologer/entity/astrologer-consult-count.entity';
import { AstrologerEntity } from '../astrologer/entity/astrologer.entity';
import { UserEntity } from '../auth/entity/user.entity';
import { CsvModule } from '../csv/csv.module';
import { ServiceTranslationEntity } from '../service/entity/service-translation.entity';
import { ServiceEntity } from '../service/entity/service.entity';
import { EnquiryController } from './controller/enquiry.controller';
import { EnquiryAssignmentEntity } from './entity/enquiry-assignment.entity';
import { EnquiryEntity } from './entity/enquiry.entity';
import { EnquiryRepository } from './repository/enquiry.repository';
import { EnquiryAssignmentService } from './service/enquiry-assignment.service';
import { EnquiryService } from './service/enquiry.service';

@Module({
  imports: [
    CsvModule,
    TypeOrmModule.forFeature([
      EnquiryEntity,
      EnquiryAssignmentEntity,
      ServiceEntity,
      ServiceTranslationEntity,
      UserEntity,
      AstrologerConsultCountEntity,
      AstrologerEntity,
    ]),
  ],
  controllers: [EnquiryController],
  providers: [EnquiryService, EnquiryRepository, EnquiryAssignmentService],
})
export class EnquiryModule {}
