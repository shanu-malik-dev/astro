import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { ServiceTranslationDto } from './service-translation.dto';

export class CreateServiceDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  display_order?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ServiceTranslationDto)
  translations: ServiceTranslationDto[];
}
