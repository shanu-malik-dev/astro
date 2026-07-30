import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProductTranslationDto } from './product-translation.dto';

export class UpdateProductDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  product_code?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  product_image?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  product_price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  display_order?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductTranslationDto)
  translations?: ProductTranslationDto[];
}
