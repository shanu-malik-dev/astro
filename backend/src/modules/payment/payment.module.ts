import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnquiryEntity } from '../enquiry/entity/enquiry.entity';
import { PaymentController } from './controller/payment.controller';
import { CustomerPaymentEntity } from './entity/customer-payment.entity';
import { PaymentRepository } from './repository/payment.repository';
import { PaymentService } from './service/payment.service';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerPaymentEntity, EnquiryEntity])],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository],
})
export class PaymentModule {}
