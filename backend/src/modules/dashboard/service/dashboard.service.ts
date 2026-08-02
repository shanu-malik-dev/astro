import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { DATABASE_TABLES } from '../../../common/constants/database.constant';
import {
  CUSTOMER_CALL_STATUS,
  ENQUIRY_STATUS,
  FOLLOW_UP_STATUS,
} from '../../../common/constants/status.constant';
import { successResponse } from '../../../common/helpers/response.helper';
import { RoleEntity } from '../../auth/entity/role.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { EnquiryEntity } from '../../enquiry/entity/enquiry.entity';
import { FollowUpEntity } from '../../follow-up/entity/follow-up.entity';
import { DashboardSummaryDto } from '../dto/dashboard-summary.dto';

type CountRow = {
  status: number | string;
  total: number | string;
};

type AuthUser = {
  sub?: string | number;
  role_id?: string | number;
};

const ADMIN_ROLE_ID = 1;

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(EnquiryEntity)
    private readonly enquiryRepository: Repository<EnquiryEntity>,
    @InjectRepository(FollowUpEntity)
    private readonly followUpRepository: Repository<FollowUpEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async summary(dto: DashboardSummaryDto, authUser?: AuthUser) {
    const executiveId = this.getExecutiveId(authUser);
    const [enquiryRows, followUpRows, customerRows] = await Promise.all([
      this.countByStatus(
        this.enquiryRepository.createQueryBuilder('enquiry'),
        'enquiry',
        dto,
        executiveId,
      ),
      this.countByStatus(
        this.followUpRepository.createQueryBuilder('followUp'),
        'followUp',
        dto,
        executiveId,
      ),
      this.countCustomers(dto, executiveId),
    ]);

    const enquiryCounts = this.toCountMap(enquiryRows);
    const followUpCounts = this.toCountMap(followUpRows);
    const customerCounts = this.toCountMap(customerRows);

    return successResponse('DASHBOARD_SUMMARY_FETCHED', {
      enquiries: {
        open: enquiryCounts[ENQUIRY_STATUS.OPEN] || 0,
        closed: enquiryCounts[ENQUIRY_STATUS.CLOSED] || 0,
        total:
          (enquiryCounts[ENQUIRY_STATUS.OPEN] || 0) +
          (enquiryCounts[ENQUIRY_STATUS.CLOSED] || 0),
      },
      follow_ups: {
        hot: followUpCounts[FOLLOW_UP_STATUS.HOT] || 0,
        warm: followUpCounts[FOLLOW_UP_STATUS.WARM] || 0,
        cold: followUpCounts[FOLLOW_UP_STATUS.COLD] || 0,
        total:
          (followUpCounts[FOLLOW_UP_STATUS.HOT] || 0) +
          (followUpCounts[FOLLOW_UP_STATUS.WARM] || 0) +
          (followUpCounts[FOLLOW_UP_STATUS.COLD] || 0),
      },
      customers: {
        called: customerCounts[CUSTOMER_CALL_STATUS.CALLED] || 0,
        not_called: customerCounts[CUSTOMER_CALL_STATUS.NOT_CALLED] || 0,
        total:
          (customerCounts[CUSTOMER_CALL_STATUS.CALLED] || 0) +
          (customerCounts[CUSTOMER_CALL_STATUS.NOT_CALLED] || 0),
      },
    });
  }

  private countByStatus(
    queryBuilder: SelectQueryBuilder<any>,
    alias: string,
    dto: DashboardSummaryDto,
    executiveId?: number,
  ) {
    queryBuilder
      .select(`${alias}.status`, 'status')
      .addSelect('COUNT(*)', 'total')
      .where(`${alias}.is_delete = :isDelete`, { isDelete: 0 });

    this.applyDateFilter(queryBuilder, alias, dto);
    this.applyExecutiveFilter(queryBuilder, alias, executiveId);

    return queryBuilder.groupBy(`${alias}.status`).getRawMany<CountRow>();
  }

  private async countCustomers(dto: DashboardSummaryDto, executiveId?: number) {
    const customerRole = await this.roleRepository.findOne({
      where: { name: 'Customer' },
    });

    if (!customerRole) return [];

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select('user.call_status', 'status')
      .addSelect('COUNT(*)', 'total')
      .where('user.is_delete = :isDelete', { isDelete: 0 })
      .andWhere('user.role_id = :roleId', { roleId: customerRole.id });

    this.applyDateFilter(queryBuilder, 'user', dto);

    if (executiveId) {
      queryBuilder.select('user.call_status', 'status').addSelect(
        'COUNT(DISTINCT user.id)',
        'total',
      );

      queryBuilder
        .innerJoin(
          EnquiryEntity,
          'enquiry',
          'enquiry.customer_id = user.id AND enquiry.is_delete = :enquiryIsDelete',
          { enquiryIsDelete: 0 },
        )
        .innerJoin(
          DATABASE_TABLES.ENQUIRY_ASSIGNMENTS,
          'assignment',
          'assignment.enq_id = enquiry.id AND assignment.is_active = :assignmentActive',
          { assignmentActive: 1 },
        )
        .andWhere('assignment.executive_id = :executiveId', { executiveId });
    }

    return queryBuilder.groupBy('user.call_status').getRawMany<CountRow>();
  }

  private applyDateFilter(
    queryBuilder: SelectQueryBuilder<any>,
    alias: string,
    dto: DashboardSummaryDto,
  ) {
    const dateColumn =
      alias === 'followUp'
        ? 'COALESCE(followUp.follow_up_at, followUp.created_at)'
        : `${alias}.created_at`;

    if (dto.date_from) {
      queryBuilder.andWhere(`${dateColumn} >= :dateFrom`, {
        dateFrom: new Date(dto.date_from),
      });
    }

    if (dto.date_to) {
      queryBuilder.andWhere(`${dateColumn} <= :dateTo`, {
        dateTo: new Date(dto.date_to),
      });
    }
  }

  private toCountMap(rows: CountRow[]) {
    return rows.reduce<Record<number, number>>((counts, row) => {
      counts[Number(row.status)] = Number(row.total) || 0;
      return counts;
    }, {});
  }

  private applyExecutiveFilter(
    queryBuilder: SelectQueryBuilder<any>,
    alias: string,
    executiveId?: number,
  ) {
    if (!executiveId) return;

    if (alias === 'enquiry') {
      queryBuilder
        .innerJoin(
          DATABASE_TABLES.ENQUIRY_ASSIGNMENTS,
          'assignment',
          'assignment.enq_id = enquiry.id AND assignment.is_active = :assignmentActive',
          { assignmentActive: 1 },
        )
        .andWhere('assignment.executive_id = :executiveId', { executiveId });
      return;
    }

    if (alias === 'followUp') {
      queryBuilder
        .innerJoin(
          'followUp.enquiry',
          'enquiry',
          'enquiry.is_delete = :enquiryIsDelete',
          { enquiryIsDelete: 0 },
        )
        .innerJoin(
          DATABASE_TABLES.ENQUIRY_ASSIGNMENTS,
          'assignment',
          'assignment.enq_id = enquiry.id AND assignment.is_active = :assignmentActive',
          { assignmentActive: 1 },
        )
        .andWhere('assignment.executive_id = :executiveId', { executiveId });
    }
  }

  private getExecutiveId(authUser?: AuthUser) {
    const userId = Number(authUser?.sub);
    const roleId = Number(authUser?.role_id);
    if (!Number.isFinite(userId) || userId <= 0 || roleId === ADMIN_ROLE_ID) {
      return undefined;
    }
    return userId;
  }
}
