import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';

@Injectable()
export class OtpService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const useStaticOtp = this.configService.get<string>('USE_STATIC_OTP') === 'true';

    if (isProduction && useStaticOtp) {
      throw new Error('STATIC_OTP_NOT_ALLOWED_IN_PRODUCTION');
    }
  }

  generateOtp(): string {
    const useStaticOtp = this.configService.get<string>('USE_STATIC_OTP') === 'true';
    if (useStaticOtp) {
      return this.configService.getOrThrow<string>('STATIC_OTP');
    }

    const length = this.configService.get<number>('OTP_LENGTH', 6);
    const min = 10 ** (length - 1);
    const max = 10 ** length;
    return String(randomInt(min, max));
  }

  hashOtp(otp: string): Promise<string> {
    return bcrypt.hash(otp, 12);
  }

  compareOtp(otp: string, hashedOtp: string): Promise<boolean> {
    return bcrypt.compare(otp, hashedOtp);
  }

  async sendOtp(
    _countryCode: string,
    _mobile: string,
    _otp: string,
  ): Promise<void> {
    return;
  }
}
