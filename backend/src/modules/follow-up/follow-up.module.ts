import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnquiryEntity } from '../enquiry/entity/enquiry.entity';
import { FollowUpController } from './controller/follow-up.controller';
import { FollowUpEntity } from './entity/follow-up.entity';
import { FollowUpRepository } from './repository/follow-up.repository';
import { FollowUpService } from './service/follow-up.service';

@Module({
  imports: [TypeOrmModule.forFeature([FollowUpEntity, EnquiryEntity])],
  controllers: [FollowUpController],
  providers: [FollowUpService, FollowUpRepository],
})
export class FollowUpModule {}
