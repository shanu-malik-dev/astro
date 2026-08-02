import { Injectable, NotFoundException } from '@nestjs/common';
import { successResponse } from '../../../common/helpers/response.helper';
import { CreateFollowUpDto } from '../dto/create-follow-up.dto';
import { ListFollowUpDto } from '../dto/list-follow-up.dto';
import { FollowUpEntity } from '../entity/follow-up.entity';
import { FollowUpRepository } from '../repository/follow-up.repository';

type AuthUser = {
  sub?: string | number;
  role_id?: string | number;
};

const ADMIN_ROLE_ID = 1;

@Injectable()
export class FollowUpService {
  constructor(private readonly followUpRepository: FollowUpRepository) {}

  async create(dto: CreateFollowUpDto, authUser?: AuthUser) {
    const enquiry = await this.followUpRepository.findAssignedEnquiry(
      dto.enq_id,
      this.getExecutiveId(authUser),
    );
    if (!enquiry) throw new NotFoundException('Enquiry not found.');

    const followUp = await this.followUpRepository.createFollowUp(dto, enquiry);
    return successResponse('FOLLOW_UP_CREATED', this.formatFollowUp(followUp));
  }

  async findAll(query: ListFollowUpDto, authUser?: AuthUser) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const skip = (page - 1) * limit;

    const queryBuilder = this.followUpRepository
      .getRepository()
      .createQueryBuilder('followUp')
      .where('followUp.is_delete = :isDelete', { isDelete: 0 });

    const executiveId = this.getExecutiveId(authUser);
    if (executiveId) {
      queryBuilder
        .innerJoin(
          'followUp.enquiry',
          'enquiry',
          'enquiry.is_delete = :enquiryIsDelete',
          { enquiryIsDelete: 0 },
        )
        .innerJoin(
          'enquiry.assignments',
          'assignment',
          'assignment.is_active = :assignmentActive',
          { assignmentActive: 1 },
        )
        .andWhere('assignment.executive_id = :executiveId', { executiveId });
    }

    if (query.status) {
      queryBuilder.andWhere('followUp.status = :status', {
        status: query.status,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(followUp.customer_name LIKE :search OR followUp.mobile LIKE :search OR followUp.country_code LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.date_from) {
      queryBuilder.andWhere('COALESCE(followUp.follow_up_at, followUp.created_at) >= :dateFrom', {
        dateFrom: new Date(query.date_from),
      });
    }

    if (query.date_to) {
      queryBuilder.andWhere('COALESCE(followUp.follow_up_at, followUp.created_at) <= :dateTo', {
        dateTo: new Date(query.date_to),
      });
    }

    const [followUps, total] = await queryBuilder
      .orderBy('COALESCE(followUp.follow_up_at, followUp.created_at)', 'ASC')
      .addOrderBy('followUp.id', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return successResponse('FOLLOW_UP_LIST_FETCHED', {
      records: followUps.map((followUp) => this.formatFollowUp(followUp)),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  }

  private formatFollowUp(followUp: FollowUpEntity) {
    return {
      id: followUp.id,
      enq_id: followUp.enq_id,
      customer_name: followUp.customer_name,
      country_code: followUp.country_code,
      mobile: followUp.mobile,
      customer_mobile: `${followUp.country_code} ${followUp.mobile}`,
      problem_name: followUp.problem_name,
      remark: followUp.remark,
      status: followUp.status,
      follow_up_at: followUp.follow_up_at || followUp.created_at,
      created_at: followUp.created_at,
    };
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
