import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class DeleteAstrologerDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;
}
