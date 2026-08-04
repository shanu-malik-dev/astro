import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  CUSTOMER_CALL_STATUS,
  CUSTOMER_SEGMENT,
  CustomerCallStatus,
  CustomerSegment,
} from '../../../common/constants/status.constant';

export class ListUserDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  role_id?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort_order?: 'asc' | 'desc';

  @IsOptional()
  @IsIn(['today', 'all'])
  range?: 'today' | 'all';

  @IsOptional()
  @Type(() => Number)
  @IsIn(Object.values(CUSTOMER_CALL_STATUS))
  call_status?: CustomerCallStatus;

  @IsOptional()
  @Type(() => Number)
  @IsIn(Object.values(CUSTOMER_SEGMENT))
  customer_segment?: CustomerSegment;

  @IsOptional()
  @IsDateString()
  date_from?: string;

  @IsOptional()
  @IsDateString()
  date_to?: string;
}
