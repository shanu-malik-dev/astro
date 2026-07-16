import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, Min } from 'class-validator';

export class UpdateServiceStatusDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;

  @Type(() => Number)
  @IsIn([0, 1])
  status: number;
}
