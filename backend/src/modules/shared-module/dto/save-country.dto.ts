import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class SaveCountryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id?: number;

  @IsString()
  @MaxLength(100)
  country_name: string;

  @IsString()
  @MaxLength(10)
  country_code: string;

  @IsString()
  @MaxLength(10)
  mobile_prefix: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  logo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;
}
