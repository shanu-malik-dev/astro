import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnquiryAssignmentEntity } from '../enquiry/entity/enquiry-assignment.entity';
import { EnquiryEntity } from '../enquiry/entity/enquiry.entity';
import { ThirdPartyModule } from '../third-party/third-party.module';
import { PaymentController } from './controller/payment.controller';
import { CustomerPaymentEntity } from './entity/customer-payment.entity';
import { PaymentLogEntity } from './entity/payment-log.entity';
import { PaymentRepository } from './repository/payment.repository';
import { PaymentService } from './service/payment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerPaymentEntity,
      PaymentLogEntity,
      EnquiryEntity,
      EnquiryAssignmentEntity,
    ]),
    ThirdPartyModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository],
})
export class PaymentModule {}
