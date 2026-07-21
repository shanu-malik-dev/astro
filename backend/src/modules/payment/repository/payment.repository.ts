import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}
