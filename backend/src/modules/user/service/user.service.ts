import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { QueryFailedError, Repository } from 'typeorm';
import { CUSTOMER_CALL_STATUS } from '../../../common/constants/status.constant';
import { successResponse } from '../../../common/helpers/response.helper';
import { RoleEntity } from '../../auth/entity/role.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { NotificationService } from '../../notification/notification.service';
import { DeleteUserDto } from '../dto/delete-user.dto';
import { ListUserDto } from '../dto/list-user.dto';
import { SaveUserDto } from '../dto/save-user.dto';
import { UpdateUserCallStatusDto } from '../dto/update-user-call-status.dto';

const ADMIN_ROLE_ID = 1;

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll(query: ListUserDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const skip = (page - 1) * limit;
    const sortOrder = query.sort_order === 'asc' ? 'ASC' : 'DESC';
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.is_delete = 0')
      .andWhere('user.role_id != :adminRoleId', { adminRoleId: ADMIN_ROLE_ID });

    if (query.role_id) {
      queryBuilder.andWhere('user.role_id = :roleId', { roleId: query.role_id });
    }

    if (query.range === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      queryBuilder.andWhere('user.created_at BETWEEN :start AND :end', {
        start,
        end,
      });
    }

    if (query.call_status) {
      queryBuilder.andWhere('user.call_status = :callStatus', {
        callStatus: query.call_status,
      });
    }

    if (query.date_from) {
      queryBuilder.andWhere('user.created_at >= :dateFrom', {
        dateFrom: new Date(query.date_from),
      });
    }

    if (query.date_to) {
      queryBuilder.andWhere('user.created_at <= :dateTo', {
        dateTo: new Date(query.date_to),
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(user.name LIKE :search OR user.email LIKE :search OR user.mobile LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [users, total] = await queryBuilder
      .orderBy('user.name', sortOrder)
      .addOrderBy('user.id', sortOrder)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return successResponse('USER_LIST_FETCHED', {
      records: users.map((user) => this.formatUser(user)),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  }

  async save(dto: SaveUserDto) {
    if (Number(dto.role_id) === ADMIN_ROLE_ID) {
      throw new BadRequestException('Admin role users cannot be managed here.');
    }

    const role = await this.roleRepository.findOne({
      where: { id: dto.role_id, status: 1 },
    });
    if (!role || Number(role.id) === ADMIN_ROLE_ID) {
      throw new BadRequestException('Invalid role selected.');
    }

    const user = dto.id
      ? await this.userRepository
          .createQueryBuilder('user')
          .addSelect('user.password_hash')
          .leftJoinAndSelect('user.role', 'role')
          .where('user.id = :id', { id: dto.id })
          .andWhere('user.is_delete = 0')
          .getOne()
      : this.userRepository.create();

    if (!user) throw new NotFoundException('User not found.');
    if (Number(user.role_id) === ADMIN_ROLE_ID) {
      throw new BadRequestException('Admin role users cannot be managed here.');
    }
    if (!dto.id && !dto.password) {
      throw new BadRequestException('Password is required for new users.');
    }

    const countryCode = dto.country_code?.trim() || '+91';
    const mobile = dto.mobile.trim();
    const email = dto.email.trim().toLowerCase();

    await this.ensureUniqueUserFields({
      id: dto.id,
      countryCode,
      mobile,
      email,
    });

    user.role_id = dto.role_id;
    user.name = dto.name.trim();
    user.country_code = countryCode;
    user.mobile = mobile;
    user.email = email;
    user.status = dto.status === 0 ? 0 : 1;
    user.is_delete = 0;

    const plainPassword = dto.password?.trim();
    const isNewUser = !dto.id;

    if (plainPassword) {
      user.password_hash = await bcrypt.hash(plainPassword, 12);
    }

    try {
      const saved = await this.userRepository.save(user);
      saved.role = role;

      if (isNewUser && plainPassword) {
        await this.sendLoginCredentialsEmail(saved, plainPassword);
      }

      return successResponse('USER_SAVED', this.formatUser(saved));
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Mobile number or email already exists.');
      }

      throw error;
    }
  }

  async delete(dto: DeleteUserDto) {
    const user = await this.userRepository.findOne({
      where: { id: dto.id, is_delete: 0 },
    });

    if (!user) throw new NotFoundException('User not found.');
    if (Number(user.role_id) === ADMIN_ROLE_ID) {
      throw new BadRequestException('Admin role users cannot be deleted here.');
    }

    await this.userRepository.update(
      { id: dto.id },
      {
        is_delete: 1,
        status: 0,
        country_code: '+0',
        mobile: `deleted-${dto.id}`,
        email: `deleted-${dto.id}@deleted.local`,
        token: null,
        token_expiry: null,
      },
    );

    return successResponse('USER_DELETED');
  }

  async updateCallStatus(dto: UpdateUserCallStatusDto) {
    const user = await this.userRepository.findOne({
      where: {
        id: dto.id,
        is_delete: 0,
      },
      relations: ['role'],
    });

    if (!user || user.role?.name?.toLowerCase() !== 'customer') {
      throw new NotFoundException('Customer not found.');
    }

    await this.userRepository.update(dto.id, {
      call_status: dto.call_status,
    });

    const updated = await this.userRepository.findOne({
      where: { id: dto.id },
      relations: ['role'],
    });

    return successResponse('CUSTOMER_CALL_STATUS_UPDATED', this.formatUser(updated));
  }

  private formatUser(user?: UserEntity | null) {
    if (!user) return null;

    return {
      id: Number(user.id),
      role_id: Number(user.role_id),
      role_name: user.role?.name || '',
      name: user.name,
      country_code: user.country_code,
      mobile: user.mobile,
      customer_mobile: `${user.country_code} ${user.mobile}`,
      email: user.email,
      status: user.status,
      call_status: user.call_status || CUSTOMER_CALL_STATUS.NOT_CALLED,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  private sendLoginCredentialsEmail(user: UserEntity, password: string) {
    const safeName = this.escapeHtml(user.name);
    const safeEmail = this.escapeHtml(user.email || '');
    const safePassword = this.escapeHtml(password);

    return this.notificationService.sendEmailNotification({
      to: user.email || '',
      subject: 'Your admin login details',
      text: `Hi ${user.name}, your user account has been created. You can login with your email and password. Email: ${user.email}. Password: ${password}.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
          <h2>Your user account has been created</h2>
          <p>Hi ${safeName},</p>
          <p>You can login with your email and password.</p>
          <div style="margin:16px 0;padding:14px;border:1px solid #d8e1ea;background:#f8fafc">
            <p style="margin:0 0 8px"><strong>Email:</strong> ${safeEmail}</p>
            <p style="margin:0"><strong>Password:</strong> ${safePassword}</p>
          </div>
          <p>Please keep these details safe.</p>
          <p>Shree Samriddhi Atro</p>
        </div>
      `,
    });
  }

  private async ensureUniqueUserFields(input: {
    id?: number;
    countryCode: string;
    mobile: string;
    email: string;
  }) {
    const mobileQuery = this.userRepository
      .createQueryBuilder('user')
      .where('user.is_delete = 0')
      .andWhere('user.country_code = :countryCode', {
        countryCode: input.countryCode,
      })
      .andWhere('user.mobile = :mobile', { mobile: input.mobile });

    const emailQuery = this.userRepository
      .createQueryBuilder('user')
      .where('user.is_delete = 0')
      .andWhere('user.email = :email', { email: input.email });

    if (input.id) {
      mobileQuery.andWhere('user.id != :id', { id: input.id });
      emailQuery.andWhere('user.id != :id', { id: input.id });
    }

    const [mobileExists, emailExists] = await Promise.all([
      mobileQuery.getExists(),
      emailQuery.getExists(),
    ]);

    if (mobileExists) {
      throw new ConflictException('Mobile number already exists.');
    }

    if (emailExists) {
      throw new ConflictException('Email already exists.');
    }
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

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
