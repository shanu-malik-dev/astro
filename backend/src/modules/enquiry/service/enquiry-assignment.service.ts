import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DATABASE_TABLES } from '../../../common/constants/database.constant';
import { UserEntity } from '../../auth/entity/user.entity';
import { EnquiryAssignmentEntity } from '../entity/enquiry-assignment.entity';

const ADMIN_ROLE_ID = 1;
const ASSIGNABLE_MODULE = 'enquiry';

@Injectable()
export class EnquiryAssignmentService {
  private readonly logger = new Logger(EnquiryAssignmentService.name);

  constructor(
    @InjectRepository(EnquiryAssignmentEntity)
    private readonly assignmentRepository: Repository<EnquiryAssignmentEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async assignRoundRobin(enquiryId: number) {
    try {
      const executives = await this.findAssignableExecutives();
      if (executives.length === 0) return;

      const lastAssignment = await this.assignmentRepository
        .createQueryBuilder('assignment')
        .innerJoin(UserEntity, 'user', 'user.id = assignment.executive_id')
        .innerJoin(
          DATABASE_TABLES.ROLE_ADMIN_MODULES,
          'module',
          'module.role_id = user.role_id',
        )
        .innerJoin(
          DATABASE_TABLES.MODULES,
          'adminModule',
          'adminModule.id = module.module_id AND adminModule.module_key = :moduleKey AND adminModule.status = :moduleStatus',
          { moduleKey: ASSIGNABLE_MODULE, moduleStatus: 1 },
        )
        .where('assignment.is_active = :active', { active: 1 })
        .andWhere('user.is_delete = :isDelete', { isDelete: 0 })
        .andWhere('user.status = :status', { status: 1 })
        .andWhere('user.role_id != :adminRoleId', { adminRoleId: ADMIN_ROLE_ID })
        .orderBy('assignment.id', 'DESC')
        .select(['assignment.id', 'assignment.executive_id'])
        .getOne();

      const lastIndex = lastAssignment
        ? executives.findIndex(
            (executive) => Number(executive.id) === Number(lastAssignment.executive_id),
          )
        : -1;
      const nextExecutive = executives[(lastIndex + 1) % executives.length];

      await this.assignmentRepository.insert({
        enq_id: enquiryId,
        executive_id: nextExecutive.id,
        assigned_by: null,
        is_active: 1,
      });
    } catch (error) {
      this.logger.warn(
        `Unable to auto-assign enquiry ${enquiryId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private findAssignableExecutives() {
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoin(
        DATABASE_TABLES.ROLE_ADMIN_MODULES,
        'module',
        'module.role_id = user.role_id',
      )
      .innerJoin(
        DATABASE_TABLES.MODULES,
        'adminModule',
        'adminModule.id = module.module_id AND adminModule.module_key = :moduleKey AND adminModule.status = :moduleStatus',
        { moduleKey: ASSIGNABLE_MODULE, moduleStatus: 1 },
      )
      .where('user.is_delete = :isDelete', { isDelete: 0 })
      .andWhere('user.status = :status', { status: 1 })
      .andWhere('user.role_id != :adminRoleId', { adminRoleId: ADMIN_ROLE_ID })
      .orderBy('user.id', 'ASC')
      .select(['user.id'])
      .getMany();
  }
}
