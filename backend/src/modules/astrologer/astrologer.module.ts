import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AstrologerStatusModule } from '../astrologer-status/astrologer-status.module';
import { AstrologerController } from './controller/astrologer.controller';
import { AstrologerConsultCountEntity } from './entity/astrologer-consult-count.entity';
import { AstrologerConsultationEntity } from './entity/astrologer-consultation.entity';
import { AstrologerRatingEntity } from './entity/astrologer-rating.entity';
import { AstrologerTranslationEntity } from './entity/astrologer-translation.entity';
import { AstrologerEntity } from './entity/astrologer.entity';
import { AstrologerRepository } from './repository/astrologer.repository';
import { AstrologerService } from './service/astrologer.service';

@Module({
  imports: [
    AstrologerStatusModule,
    TypeOrmModule.forFeature([
      AstrologerEntity,
      AstrologerTranslationEntity,
      AstrologerRatingEntity,
      AstrologerConsultationEntity,
      AstrologerConsultCountEntity,
    ]),
  ],
  controllers: [AstrologerController],
  providers: [AstrologerService, AstrologerRepository],
  exports: [AstrologerService],
})
export class AstrologerModule {}
