import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsPositive } from 'class-validator';
import { CUSTOMER_CALL_STATUS, CustomerCallStatus } from '../../../common/constants/status.constant';

export class UpdateUserCallStatusDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  id: number;

  @Type(() => Number)
  @IsIn(Object.values(CUSTOMER_CALL_STATUS))
  call_status: CustomerCallStatus;
}
