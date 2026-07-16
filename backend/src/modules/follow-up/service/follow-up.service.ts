import { Injectable, NotFoundException } from '@nestjs/common';
import { successResponse } from '../../../common/helpers/response.helper';
import { CreateFollowUpDto } from '../dto/create-follow-up.dto';
import { ListFollowUpDto } from '../dto/list-follow-up.dto';
import { FollowUpEntity } from '../entity/follow-up.entity';
import { FollowUpRepository } from '../repository/follow-up.repository';

@Injectable()
export class FollowUpService {
  constructor(private readonly followUpRepository: FollowUpRepository) {}

  async create(dto: CreateFollowUpDto) {
    const enquiry = await this.followUpRepository.findEnquiry(dto.enq_id);
    if (!enquiry) throw new NotFoundException('Enquiry not found.');

    const followUp = await this.followUpRepository.createFollowUp(dto, enquiry);
    return successResponse('FOLLOW_UP_CREATED', this.formatFollowUp(followUp));
  }

  async findAll(query: ListFollowUpDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const skip = (page - 1) * limit;

    const queryBuilder = this.followUpRepository
      .getRepository()
      .createQueryBuilder('followUp')
      .where('followUp.is_delete = :isDelete', { isDelete: 0 });

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
      queryBuilder.andWhere('followUp.created_at >= :dateFrom', {
        dateFrom: new Date(query.date_from),
      });
    }

    if (query.date_to) {
      queryBuilder.andWhere('followUp.created_at <= :dateTo', {
        dateTo: new Date(query.date_to),
      });
    }

    const [followUps, total] = await queryBuilder
      .orderBy('followUp.id', 'DESC')
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
      created_at: followUp.created_at,
    };
  }
}
