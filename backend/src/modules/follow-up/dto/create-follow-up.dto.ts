import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateFollowUpDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  enq_id: number;

  @IsIn(['hot', 'warm', 'cold'])
  status: 'hot' | 'warm' | 'cold';

  @IsString()
  @IsNotEmpty()
  remark: string;
}
