import { Transform } from 'class-transformer';
import { IsIn, IsString } from 'class-validator';
import { SUPPORTED_COUNTRY_CODES } from '../constants/auth.constant';
import { IsSupportedMobile } from '../validators/is-supported-mobile.validator';

export class LoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsIn(SUPPORTED_COUNTRY_CODES)
  country_code: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsSupportedMobile()
  mobile: string;
}
