import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpService } from '../../common/services/otp/otp.service';
import { AuthController } from './controller/auth.controller';
import { LoginLogEntity } from './entity/login-log.entity';
import { RoleEntity } from './entity/role.entity';
import { UserEntity } from './entity/user.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthRepository } from './repository/auth.repository';
import { AuthService } from './service/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { IsValidOtpConstraint } from './validators/is-valid-otp.validator';
import { IsSupportedMobileConstraint } from './validators/is-supported-mobile.validator';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoleEntity, UserEntity, LoginLogEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    OtpService,
    JwtAuthGuard,
    JwtStrategy,
    IsValidOtpConstraint,
    IsSupportedMobileConstraint,
  ],
  exports: [JwtAuthGuard, AuthService],
})
export class AuthModule {}
