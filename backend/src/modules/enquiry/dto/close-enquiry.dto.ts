import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { CUSTOMER_SEGMENT, CustomerSegment } from '../../../common/constants/status.constant';

export class CloseEnquiryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;

  @IsString()
  @IsNotEmpty()
  remark: string;

  @Type(() => Number)
  @IsInt()
  @IsIn(Object.values(CUSTOMER_SEGMENT))
  customer_segment: CustomerSegment;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  astrologer_id?: number;
}
