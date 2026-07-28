import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { FOLLOW_UP_STATUS, FollowUpStatus } from '../../../common/constants/status.constant';

export class CreateFollowUpDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  enq_id: number;

  @Type(() => Number)
  @IsIn(Object.values(FOLLOW_UP_STATUS))
  status: FollowUpStatus;

  @IsString()
  @IsNotEmpty()
  remark: string;
}
