import { Type } from 'class-transformer';
import {
  ArrayMinSize,
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

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  product_code: string;

  @IsString()
  @IsNotEmpty()
  product_image: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  product_price: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  display_order?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductTranslationDto)
  translations: ProductTranslationDto[];
}
