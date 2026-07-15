import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { QueryFailedError } from 'typeorm';
import { successResponse } from '../../../common/helpers/response.helper';
import { LanguageContext } from '../../../common/i18n/language-context';
import { OtpService } from '../../../common/services/otp/otp.service';
import { getMessage } from '../../../lang';
import { AUTH_CONSTANTS } from '../constants/auth.constant';
import { LoginDto } from '../dto/login.dto';
import { ResendOtpDto } from '../dto/resend-otp.dto';
import { SignupDto } from '../dto/signup.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { UserEntity } from '../entity/user.entity';
import { AuthRepository } from '../repository/auth.repository';

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(dto: SignupDto): Promise<unknown> {
    const existingUser = await this.authRepository.findUserByMobile(
      dto.country_code,
      dto.mobile,
    );

    if (existingUser && existingUser.status === 1 && existingUser.is_delete === 0) {
      throw new ConflictException(this.message('USER_ALREADY_EXISTS'));
    }

    const role = await this.authRepository.findRoleByName(AUTH_CONSTANTS.DEFAULT_ROLE);
    if (!role) {
      throw new NotFoundException(this.message('DEFAULT_ROLE_NOT_FOUND'));
    }
    let userId:number = 0;

    if(existingUser?.['id']){
      userId = existingUser?.['id']
    }

    if(existingUser && existingUser.status === 0 && existingUser.is_delete !== 0){
      const user = await this.authRepository.createUser({
        role_id: role.id,
        name: dto.name,
        country_code: dto.country_code,
        mobile: dto.mobile,
      });

      userId = user.id;
      
    }

    try {

      await this.createAndSendOtp(userId, dto.country_code, dto.mobile);

      return successResponse(
        'OTP_SENT',
        {
          country_code: dto.country_code,
          mobile: dto.mobile,
        },
      );
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(this.message('USER_ALREADY_EXISTS'));
      }

      throw error;
    }
  }

  async login(dto: LoginDto): Promise<unknown> {
    const user = await this.findActiveUser(dto.country_code, dto.mobile);
    await this.createAndSendOtp(user.id, dto.country_code, dto.mobile);

    return successResponse(
      'OTP_SENT',
      {
        country_code: dto.country_code,
        mobile: dto.mobile,
      },
    );
  }

  async verifyOtp(dto: VerifyOtpDto, requestMeta?: RequestMeta): Promise<unknown> {
    const user = await this.findActiveUser(dto.country_code, dto.mobile, true,true);

    if (!user.otp || !user.otp_expiry) {
      await this.createFailedLoginLog(user, dto, requestMeta, 'OTP_NOT_FOUND');
      throw new UnauthorizedException(this.message('INVALID_OR_EXPIRED_OTP'));
    }

    if (user.otp_expiry <= new Date()) {
      await this.createFailedLoginLog(user, dto, requestMeta, 'OTP_EXPIRED');
      throw new UnauthorizedException(this.message('INVALID_OR_EXPIRED_OTP'));
    }

    const isValidOtp = await this.otpService.compareOtp(dto.otp, user.otp);
    if (!isValidOtp) {
      await this.createFailedLoginLog(user, dto, requestMeta, 'OTP_INVALID');
      throw new UnauthorizedException(this.message('INVALID_OR_EXPIRED_OTP'));
    }

    const tokens = await this.signTokens(user);
    const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 12);

    await this.authRepository.updateUserToken(
      user.id,
      hashedRefreshToken,
      this.getRefreshTokenExpiry(),
      1
    );
    await this.authRepository.clearUserOtp(user.id);
    await this.authRepository.createLoginLog({
      user_id: user.id,
      country_code: dto.country_code,
      mobile: dto.mobile,
      login_type: AUTH_CONSTANTS.LOGIN_TYPE,
      ip_address: requestMeta?.ipAddress,
      user_agent: requestMeta?.userAgent,
      is_success: 1,
    });

    return successResponse(
      'LOGIN_SUCCESSFUL',
      {
        ...tokens,
        token_type: AUTH_CONSTANTS.TOKEN_TYPE,
        expires_in: this.getAccessTokenSeconds(),
        user: this.toSafeUser(user),
      },
    );
  }

  async resendOtp(dto: ResendOtpDto): Promise<unknown> {
    const user = await this.findActiveUser(dto.country_code, dto.mobile);
    await this.createAndSendOtp(user.id, dto.country_code, dto.mobile);

    return successResponse(
      'OTP_SENT',
      {
        country_code: dto.country_code,
        mobile: dto.mobile,
      },
    );
  }

  private async createAndSendOtp(
    userId: number,
    countryCode: string,
    mobile: string,
  ) {
    const otp = this.otpService.generateOtp();
    const hashedOtp = await this.otpService.hashOtp(otp);
    const otpExpiry = new Date(
      Date.now() + this.configService.get<number>('OTP_EXPIRY_SECONDS', 300) * 1000,
    );

    await this.authRepository.updateUserOtp(userId, hashedOtp, otpExpiry);
    await this.otpService.sendOtp(countryCode, mobile, otp);
  }

  private async findActiveUser(
    countryCode: string,
    mobile: string,
    includeSensitive = false,
    skipStatusCheck = false
  ) {
    const user = await this.authRepository.findUserByMobile(
      countryCode,
      mobile,
      includeSensitive,
    );

    if(user?.is_delete !== 0){
      throw new UnauthorizedException(this.message('USER_NOT_FOUND_OR_INACTIVE'));
    }
     if(user?.status !== 1 && !skipStatusCheck){
      throw new UnauthorizedException(this.message('USER_NOT_FOUND_OR_INACTIVE'));
    }

    return user;
  }

  private message(key: string) {
    return getMessage(key, LanguageContext.getLang());
  }

  private async signTokens(user: UserEntity) {
    const payload = {
      sub: user.id,
      role_id: user.role_id,
      country_code: user.country_code,
      mobile: user.mobile,
    };

    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN'),
    });
    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
    });

    return { access_token, refresh_token };
  }

  private toSafeUser(user: UserEntity) {
    return {
      id: user.id,
      role_id: user.role_id,
      name: user.name,
      country_code: user.country_code,
      mobile: user.mobile,
    };
  }

  private createFailedLoginLog(
    user: UserEntity,
    dto: VerifyOtpDto,
    requestMeta: RequestMeta | undefined,
    failureReason: string,
  ) {
    return this.authRepository.createLoginLog({
      user_id: user.id,
      country_code: dto.country_code,
      mobile: dto.mobile,
      login_type: AUTH_CONSTANTS.LOGIN_TYPE,
      ip_address: requestMeta?.ipAddress,
      user_agent: requestMeta?.userAgent,
      is_success: 0,
      failure_reason: failureReason,
    });
  }

  private getAccessTokenSeconds() {
    return this.durationToSeconds(
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    );
  }

  private getRefreshTokenExpiry() {
    const seconds = this.durationToSeconds(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
    );
    return new Date(Date.now() + seconds * 1000);
  }

  private durationToSeconds(value: string) {
    const match = /^(\d+)([smhd])?$/.exec(value);
    if (!match) {
      return 900;
    }

    const amount = Number(match[1]);
    const unit = match[2] || 's';
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    };

    return amount * multipliers[unit];
  }

  private isDuplicateKeyError(error: unknown) {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = (error as QueryFailedError & {
      driverError: { code?: string; errno?: number };
    }).driverError;

    return driverError.code === 'ER_DUP_ENTRY' || driverError.errno === 1062;
  }
}
