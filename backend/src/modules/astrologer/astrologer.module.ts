import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AstrologerController } from './controller/astrologer.controller';
import { AstrologerConsultationEntity } from './entity/astrologer-consultation.entity';
import { AstrologerRatingEntity } from './entity/astrologer-rating.entity';
import { AstrologerTranslationEntity } from './entity/astrologer-translation.entity';
import { AstrologerEntity } from './entity/astrologer.entity';
import { AstrologerRepository } from './repository/astrologer.repository';
import { AstrologerService } from './service/astrologer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AstrologerEntity,
      AstrologerTranslationEntity,
      AstrologerRatingEntity,
      AstrologerConsultationEntity,
    ]),
  ],
  controllers: [AstrologerController],
  providers: [AstrologerService, AstrologerRepository],
  exports: [AstrologerService],
})
export class AstrologerModule {}
