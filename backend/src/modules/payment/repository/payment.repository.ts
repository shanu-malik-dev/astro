import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DATABASE_TABLES } from '../../../common/constants/database.constant';
import { EnquiryEntity } from '../../enquiry/entity/enquiry.entity';
import { CustomerPaymentEntity } from '../entity/customer-payment.entity';
import { PaymentLogEntity } from '../entity/payment-log.entity';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(CustomerPaymentEntity)
    private readonly paymentRepository: Repository<CustomerPaymentEntity>,
    @InjectRepository(EnquiryEntity)
    private readonly enquiryRepository: Repository<EnquiryEntity>,
    @InjectRepository(PaymentLogEntity)
    private readonly paymentLogRepository: Repository<PaymentLogEntity>,
  ) {}

  getRepository() {
    return this.paymentRepository;
  }

  getLogRepository() {
    return this.paymentLogRepository;
  }

  findEnquiry(id: number) {
    return this.enquiryRepository.findOne({
      where: { id, is_delete: 0 },
    });
  }

  async enquiryExists(id: number) {
    return this.enquiryRepository.exist({
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

  findByProviderPaymentId(provider: string, providerPaymentId: string) {
    return this.paymentRepository.findOne({
      where: {
        provider: provider as any,
        provider_payment_id: providerPaymentId,
      },
    });
  }
}
