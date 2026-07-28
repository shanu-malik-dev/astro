import { Injectable, NotFoundException } from '@nestjs/common';
import { SUPPORT_STATUS, SupportStatus } from '../../../common/constants/status.constant';
import { successResponse } from '../../../common/helpers/response.helper';
import { NotificationService } from '../../notification/notification.service';
import { CreateSupportRequestDto } from '../dto/create-support-request.dto';
import { ListSupportRequestDto } from '../dto/list-support-request.dto';
import { UpdateSupportStatusDto } from '../dto/update-support-status.dto';
import { SupportRequestEntity } from '../entity/support-request.entity';
import { SupportRepository } from '../repository/support.repository';

@Injectable()
export class SupportService {
  constructor(
    private readonly supportRepository: SupportRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async create(dto: CreateSupportRequestDto) {
    const request = await this.supportRepository.getRepository().save(
      this.supportRepository.getRepository().create({
        full_name: dto.full_name,
        email: dto.email,
        subject: dto.subject?.trim() || null,
        message: dto.message,
        status: SUPPORT_STATUS.OPEN,
      }),
    );

    this.sendSupportTicketEmail(request).catch(() => undefined);

    return successResponse('SUPPORT_REQUEST_CREATED', this.formatRequest(request));
  }

  async findAll(query: ListSupportRequestDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const skip = (page - 1) * limit;
    const queryBuilder = this.supportRepository
      .getRepository()
      .createQueryBuilder('support');

    if (query.status) {
      queryBuilder.andWhere('support.status = :status', { status: query.status });
    }

    if ((query.range || 'today') === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('support.created_at BETWEEN :start AND :end', {
        start,
        end,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(support.full_name LIKE :search OR support.email LIKE :search OR support.subject LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [records, total] = await queryBuilder
      .orderBy('support.id', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    const counts = await this.getCounts(query);

    return successResponse('SUPPORT_REQUEST_LIST_FETCHED', {
      records: records.map((record) => this.formatRequest(record)),
      counts,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  }

  private async getCounts(query: ListSupportRequestDto) {
    const countByStatus = async (status?: SupportStatus) => {
      const queryBuilder = this.supportRepository
        .getRepository()
        .createQueryBuilder('support');

      if (status) {
        queryBuilder.andWhere('support.status = :status', { status });
      }

      if ((query.range || 'today') === 'today') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        queryBuilder.andWhere('support.created_at BETWEEN :start AND :end', {
          start,
          end,
        });
      }

      if (query.search) {
        queryBuilder.andWhere(
          '(support.full_name LIKE :search OR support.email LIKE :search OR support.subject LIKE :search)',
          { search: `%${query.search}%` },
        );
      }

      return queryBuilder.getCount();
    };

    const [open, closed, total] = await Promise.all([
      countByStatus(SUPPORT_STATUS.OPEN),
      countByStatus(SUPPORT_STATUS.CLOSED),
      countByStatus(),
    ]);

    return {
      [SUPPORT_STATUS.OPEN]: open,
      [SUPPORT_STATUS.CLOSED]: closed,
      total,
    };
  }

  async updateStatus(dto: UpdateSupportStatusDto) {
    const request = await this.supportRepository.getRepository().findOne({
      where: { id: dto.id },
    });
    if (!request) throw new NotFoundException('Support request not found.');

    request.status = dto.status;
    const updated = await this.supportRepository.getRepository().save(request);

    return successResponse('SUPPORT_REQUEST_STATUS_UPDATED', this.formatRequest(updated));
  }

  private formatRequest(request: SupportRequestEntity) {
    return {
      id: request.id,
      full_name: request.full_name,
      email: request.email,
      subject: request.subject,
      message: request.message,
      status: request.status,
      created_at: request.created_at,
      updated_at: request.updated_at,
    };
  }

  private sendSupportTicketEmail(request: SupportRequestEntity) {
    return this.notificationService.sendEmailNotification({
      to: request.email,
      subject: `Support request received #${request.id}`,
      text: `Hi ${request.full_name}, we have received your support request #${request.id}.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
          <h2>Support request received</h2>
          <p>Hi ${this.escapeHtml(request.full_name)},</p>
          <p>We have received your support request.</p>
          <p><strong>Ticket ID:</strong> #${request.id}</p>
          ${
            request.subject
              ? `<p><strong>Subject:</strong> ${this.escapeHtml(request.subject)}</p>`
              : ''
          }
          <p>Our team will review it and get back to you.</p>
          <p>Shree Samriddhi Atro</p>
        </div>
      `,
    });
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
