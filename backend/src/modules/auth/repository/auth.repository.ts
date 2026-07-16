import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginLogEntity } from '../entity/login-log.entity';
import { RoleEntity } from '../entity/role.entity';
import { UserEntity } from '../entity/user.entity';

type LoginLogInput = {
  user_id?: number | null;
  country_code: string;
  mobile: string;
  login_type: string;
  ip_address?: string | null;
  user_agent?: string | null;
  is_success: number;
  failure_reason?: string | null;
};

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(LoginLogEntity)
    private readonly loginLogRepository: Repository<LoginLogEntity>,
  ) {}

  findRoleByName(name: string) {
    return this.roleRepository.findOne({ where: { name, status: 1 } });
  }

  findUserByMobile(countryCode: string, mobile: string, includeSensitive = false) {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.country_code = :countryCode', { countryCode })
      .andWhere('user.mobile = :mobile', { mobile });

    if (includeSensitive) {
      query.addSelect(['user.otp', 'user.token']);
    }

    return query.getOne();
  }

  createUser(input: Pick<UserEntity, 'role_id' | 'name' | 'country_code' | 'mobile'>) {
    return this.userRepository.save(this.userRepository.create(input));
  }

  updateUserOtp(userId: number, otp: string, otpExpiry: Date) {
    return this.userRepository.update(
      { id: userId },
      { otp, otp_expiry: otpExpiry },
    );
  }

  clearUserOtp(userId: number) {
    return this.userRepository.update(
      { id: userId },
      { otp: null, otp_expiry: null },
    );
  }

  updateUserToken(userId: number, token: string, tokenExpiry: Date,status:number) {
    return this.userRepository.update(
      { id: userId },
      { token, token_expiry: tokenExpiry,status },
    );
  }

  clearUserToken(userId: number) {
    return this.userRepository.update(
      { id: userId },
      { token: null, token_expiry: null },
    );
  }

  createLoginLog(input: LoginLogInput) {
    return this.loginLogRepository.save(
      this.loginLogRepository.create({
        user_id: input.user_id ?? null,
        country_code: input.country_code,
        mobile: input.mobile,
        login_type: input.login_type,
        ip_address: input.ip_address ?? null,
        user_agent: input.user_agent ?? null,
        is_success: input.is_success,
        failure_reason: input.failure_reason ?? null,
      }),
    );
  }
}
