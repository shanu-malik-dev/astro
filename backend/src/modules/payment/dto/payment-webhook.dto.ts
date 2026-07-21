import { IsIn, IsOptional, IsString } from 'class-validator';
import type { PaymentProvider, PaymentStatus } from '../entity/customer-payment.entity';

export class PaymentWebhookDto {
  @IsOptional()
  @IsIn(['razorpay', 'stripe'])
  provider?: PaymentProvider;

  @IsOptional()
  @IsString()
  payment_id?: string;

  @IsOptional()
  @IsIn(['created', 'pending', 'paid', 'failed', 'cancelled', 'expired'])
  status?: PaymentStatus;
}
