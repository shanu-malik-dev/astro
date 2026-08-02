import { Body, Controller, Headers, Ip, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { IsPublic } from '../decorators/is-public.decorator';
import { AdminEmailLoginDto } from '../dto/admin-email-login.dto';
import { EmailLoginDto } from '../dto/email-login.dto';
import { ForgotPasswordResetDto } from '../dto/forgot-password-reset.dto';
import { ForgotPasswordSendOtpDto } from '../dto/forgot-password-send-otp.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ResendOtpDto } from '../dto/resend-otp.dto';
import { SignupDto } from '../dto/signup.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { AuthService } from '../service/auth.service';
import { JwtPayload } from '../strategies/jwt.strategy';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @IsPublic()
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @IsPublic()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @IsPublic()
  @Post('admin/email-login')
  adminEmailLogin(
    @Body() dto: AdminEmailLoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.adminEmailLogin(dto, {
      ipAddress,
      userAgent,
    });
  }

  @IsPublic()
  @Post('email-login')
  emailLogin(
    @Body() dto: EmailLoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.emailLogin(dto, {
      ipAddress,
      userAgent,
    });
  }

  @IsPublic()
  @Post('forgot-password/send-otp')
  sendForgotPasswordOtp(@Body() dto: ForgotPasswordSendOtpDto) {
    return this.authService.sendForgotPasswordOtp(dto);
  }

  @IsPublic()
  @Post('forgot-password/reset')
  resetForgotPassword(@Body() dto: ForgotPasswordResetDto) {
    return this.authService.resetForgotPassword(dto);
  }

  @IsPublic()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @IsPublic()
  @Post('verify-otp')
  verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.verifyOtp(dto, {
      ipAddress,
      userAgent,
    });
  }

  @IsPublic()
  @Post('resend-otp')
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  @Post('logout')
  logout(@Req() req: AuthenticatedRequest) {
    return this.authService.logout(req.user.sub);
  }

  @Post('me')
  me(@Req() req: AuthenticatedRequest) {
    return this.authService.me(req.user.sub);
  }
}
