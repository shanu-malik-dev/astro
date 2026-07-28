import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { PAYMENT_STATUS, PaymentStatus } from '../../../common/constants/status.constant';
import type { PaymentProvider } from '../entity/customer-payment.entity';

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
  @Type(() => Number)
  @IsIn(Object.values(PAYMENT_STATUS))
  payment_status?: PaymentStatus;
}
