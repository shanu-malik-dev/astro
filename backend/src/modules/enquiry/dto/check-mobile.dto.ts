import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CheckMobileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  country_code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  mobile: string;
}
