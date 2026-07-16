import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../auth/entity/user.entity';
import { ProblemTranslationEntity } from '../problem/entity/problem-translation.entity';
import { ProblemEntity } from '../problem/entity/problem.entity';
import { EnquiryController } from './controller/enquiry.controller';
import { EnquiryEntity } from './entity/enquiry.entity';
import { EnquiryRepository } from './repository/enquiry.repository';
import { EnquiryService } from './service/enquiry.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EnquiryEntity,
      ProblemEntity,
      ProblemTranslationEntity,
      UserEntity,
    ]),
  ],
  controllers: [EnquiryController],
  providers: [EnquiryService, EnquiryRepository],
})
export class EnquiryModule {}
