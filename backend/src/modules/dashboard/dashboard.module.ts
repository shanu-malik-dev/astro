import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from '../auth/entity/role.entity';
import { UserEntity } from '../auth/entity/user.entity';
import { EnquiryAssignmentEntity } from '../enquiry/entity/enquiry-assignment.entity';
import { EnquiryEntity } from '../enquiry/entity/enquiry.entity';
import { FollowUpEntity } from '../follow-up/entity/follow-up.entity';
import { DashboardController } from './controller/dashboard.controller';
import { DashboardService } from './service/dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EnquiryEntity,
      EnquiryAssignmentEntity,
      FollowUpEntity,
      UserEntity,
      RoleEntity,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
