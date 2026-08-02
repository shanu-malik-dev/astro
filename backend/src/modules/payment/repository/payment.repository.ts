import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DATABASE_TABLES } from '../../../common/constants/database.constant';
import { EnquiryEntity } from '../../enquiry/entity/enquiry.entity';
import { CustomerPaymentEntity } from '../entity/customer-payment.entity';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(CustomerPaymentEntity)
    private readonly paymentRepository: Repository<CustomerPaymentEntity>,
    @InjectRepository(EnquiryEntity)
    private readonly enquiryRepository: Repository<EnquiryEntity>,
  ) {}

  getRepository() {
    return this.paymentRepository;
  }

  findEnquiry(id: number) {
    return this.enquiryRepository.findOne({
      where: { id, is_delete: 0 },
    });
  }

  findAssignedEnquiry(id: number, executiveId?: number) {
    const queryBuilder = this.enquiryRepository
      .createQueryBuilder('enquiry')
      .where('enquiry.id = :id', { id })
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
}
