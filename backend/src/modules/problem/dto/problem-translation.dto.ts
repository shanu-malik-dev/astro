import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ProblemTranslationDto {
  @IsString()
  @IsIn(['en', 'hi'])
  lang_code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;
}
