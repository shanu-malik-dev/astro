import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AstrologerTranslationDto {
  @IsString()
  @IsIn(['en', 'hi'])
  lang_code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsNotEmpty()
  expertise: string;

  @IsOptional()
  @IsString()
  description?: string;
}
