import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreatePaymentLinkDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  enq_id: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;
}
