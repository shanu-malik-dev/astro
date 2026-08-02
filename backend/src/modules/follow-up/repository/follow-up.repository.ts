import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DATABASE_TABLES } from '../../../common/constants/database.constant';
import { EnquiryEntity } from '../../enquiry/entity/enquiry.entity';
import { CreateFollowUpDto } from '../dto/create-follow-up.dto';
import { FollowUpEntity } from '../entity/follow-up.entity';

@Injectable()
export class FollowUpRepository {
  constructor(
    @InjectRepository(FollowUpEntity)
    private readonly followUpRepository: Repository<FollowUpEntity>,
    @InjectRepository(EnquiryEntity)
    private readonly enquiryRepository: Repository<EnquiryEntity>,
  ) {}

  getRepository() {
    return this.followUpRepository;
  }

  findEnquiry(enquiryId: number) {
    return this.enquiryRepository.findOne({
      where: { id: enquiryId, is_delete: 0 },
    });
  }

  findAssignedEnquiry(enquiryId: number, executiveId?: number) {
    const queryBuilder = this.enquiryRepository
      .createQueryBuilder('enquiry')
      .where('enquiry.id = :enquiryId', { enquiryId })
      .andWhere('enquiry.is_delete = :isDelete', { isDelete: 0 });

    if (executiveId) {
      queryBuilder
        .innerJoin(
          DATABASE_TABLES.ENQUIRY_ASSIGNMENTS,
          'assignment',
          'assignment.enq_id = enquiry.id AND assignment.is_active = :active',
          { active: 1 },
        )
        .andWhere('assignment.executive_id = :executiveId', { executiveId });
    }

    return queryBuilder.getOne();
  }

  createFollowUp(dto: CreateFollowUpDto, enquiry: EnquiryEntity) {
    return this.followUpRepository.save(
      this.followUpRepository.create({
        enq_id: enquiry.id,
        customer_name: enquiry.customer_name,
        country_code: enquiry.country_code,
        mobile: enquiry.mobile,
        problem_name: enquiry.problem_name,
        remark: dto.remark.trim(),
        status: dto.status,
        follow_up_at: new Date(dto.follow_up_at),
        is_delete: 0,
      }),
    );
  }
}
