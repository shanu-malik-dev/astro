import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class PurchaseProductDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  product_id: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  customer_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  country_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  mobile?: string;
}
