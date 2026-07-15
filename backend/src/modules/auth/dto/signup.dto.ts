import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { SUPPORTED_COUNTRY_CODES } from '../constants/auth.constant';
import { IsSupportedMobile } from '../validators/is-supported-mobile.validator';

export class SignupDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsIn(SUPPORTED_COUNTRY_CODES)
  country_code: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsSupportedMobile()
  mobile: string;
}
