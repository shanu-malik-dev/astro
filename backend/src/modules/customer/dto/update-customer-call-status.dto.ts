import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsPositive } from 'class-validator';

export class UpdateCustomerCallStatusDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  id: number;

  @IsIn(['called', 'not_called'])
  call_status: 'called' | 'not_called';
}
