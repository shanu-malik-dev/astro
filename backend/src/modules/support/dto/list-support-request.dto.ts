import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { SUPPORT_STATUS, SupportStatus } from '../../../common/constants/status.constant';

export class ListSupportRequestDto {
  @IsOptional()
  @Transform(({ value }) => Number(value || 1))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value || 10))
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === '' ? undefined : Number(value)))
  @IsIn(Object.values(SUPPORT_STATUS))
  status?: SupportStatus;

  @IsOptional()
  @IsIn(['today', 'all'])
  range?: 'today' | 'all';

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  date_from?: string;

  @IsOptional()
  @IsDateString()
  date_to?: string;
}
