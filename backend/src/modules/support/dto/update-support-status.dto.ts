import { Transform } from 'class-transformer';
import { IsIn, IsInt } from 'class-validator';
import { SUPPORT_STATUS, SupportStatus } from '../../../common/constants/status.constant';

export class UpdateSupportStatusDto {
  @IsInt()
  id: number;

  @Transform(({ value }) => Number(value))
  @IsIn(Object.values(SUPPORT_STATUS))
  status: SupportStatus;
}
