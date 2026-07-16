import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateEnquiryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customer_id?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  customer_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  country_code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  mobile: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  problem_id: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  problem_name?: string;
}
