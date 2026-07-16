import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
        is_delete: 0,
      }),
    );
  }
}
