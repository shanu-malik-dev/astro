import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import type { PaymentProvider, PaymentStatus } from '../entity/customer-payment.entity';

export class ListPaymentDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['razorpay', 'stripe'])
  provider?: PaymentProvider;

  @IsOptional()
  @IsIn(['created', 'pending', 'paid', 'failed', 'cancelled', 'expired'])
  payment_status?: PaymentStatus;
}
