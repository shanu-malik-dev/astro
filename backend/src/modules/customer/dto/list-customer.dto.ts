import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { CUSTOMER_CALL_STATUS, CustomerCallStatus } from '../../../common/constants/status.constant';

export class ListCustomerDto {
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
  @IsIn(['today', 'all'])
  range?: 'today' | 'all';

  @IsOptional()
  @Type(() => Number)
  @IsIn(Object.values(CUSTOMER_CALL_STATUS))
  call_status?: CustomerCallStatus;
}
