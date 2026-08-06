import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CUSTOMER_SEGMENT, ENQUIRY_STATUS } from '../../../common/constants/status.constant';
import { successResponse } from '../../../common/helpers/response.helper';
import { CsvService } from '../../csv/service/csv.service';
import { CheckMobileDto } from '../dto/check-mobile.dto';
import { CloseEnquiryDto } from '../dto/close-enquiry.dto';
import { CreateEnquiryDto } from '../dto/create-enquiry.dto';
import { ListEnquiryDto } from '../dto/list-enquiry.dto';
import { EnquiryEntity } from '../entity/enquiry.entity';
import { EnquiryRepository } from '../repository/enquiry.repository';
import { EnquiryAssignmentService } from './enquiry-assignment.service';

type AuthUser = {
  sub?: string | number;
  role_id?: string | number;
};

const ADMIN_ROLE_ID = 1;

@Injectable()
export class EnquiryService {
  constructor(
    private readonly enquiryRepository: EnquiryRepository,
    private readonly assignmentService: EnquiryAssignmentService,
    private readonly csvService: CsvService,
  ) {}

  async create(dto: CreateEnquiryDto) {
    const service = await this.enquiryRepository.findServiceById(dto.problem_id);
    if (!service) throw new NotFoundException('Service not found.');

    const exists = await this.enquiryRepository.existsOpenEnquiry(dto);
    if (exists) {
      throw new BadRequestException(
        'An open enquiry already exists for this customer and service.',
      );
    }

    const problemName =
      dto.problem_name?.trim() ||
      this.getEnglishProblemName(service.translations || []);
    const customer = await this.findOrCreateCustomer(dto);
    const enquiry = await this.enquiryRepository.createEnquiry(
      {
        ...dto,
        customer_id: customer?.id || dto.customer_id,
      },
      problemName,
    );
    void this.assignmentService.assignRoundRobin(enquiry.id);

    const created = await this.findById(enquiry.id);

    return successResponse('ENQUIRY_CREATED', this.formatEnquiry(created));
  }

  async findAll(query: ListEnquiryDto, authUser?: AuthUser) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const skip = (page - 1) * limit;
    const queryBuilder = this.createFilteredQuery(query, authUser);

    const [enquiries, total] = await queryBuilder
      .orderBy('enquiry.id', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return successResponse('ENQUIRY_LIST_FETCHED', {
      records: enquiries.map((enquiry) => this.formatEnquiry(enquiry)),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  }

  async exportCsv(query: ListEnquiryDto, authUser?: AuthUser) {
    const enquiries = await this.createFilteredQuery(query, authUser)
      .orderBy('enquiry.id', 'DESC')
      .getMany();
    const exportFile = await this.csvService.createExport({
      filename: 'enquiries',
      columns: [
        { key: 'enq_id', header: 'Enq ID' },
        { key: 'created_at', header: 'Created Date' },
        { key: 'customer_name', header: 'Customer Name' },
        { key: 'customer_number', header: 'Customer Number' },
        { key: 'problem_name', header: 'Problem' },
        { key: 'status', header: 'Status' },
        { key: 'close_remark', header: 'Close Remark' },
        { key: 'customer_segment', header: 'Customer Segment' },
      ],
      rows: enquiries.map((enquiry) => {
        const formatted = this.formatEnquiry(enquiry);

        return {
          enq_id: formatted?.id,
          created_at: formatted?.created_at
            ? new Date(formatted.created_at).toLocaleString('en-IN')
            : '',
          customer_name: formatted?.customer_name || '',
          customer_number: formatted?.customer_mobile || '',
          problem_name: formatted?.problem_name || '',
          status:
            formatted?.status === ENQUIRY_STATUS.CLOSED ? 'Closed' : 'Open',
          close_remark: formatted?.close_remark || '',
          customer_segment: this.getCustomerSegmentLabel(
            formatted?.customer_segment,
          ),
        };
      }),
    });

    return successResponse('ENQUIRY_EXPORT_CREATED', exportFile);
  }

  async checkMobile(dto: CheckMobileDto) {
    const exists = await this.enquiryRepository.mobileExists(
      dto.country_code,
      dto.mobile,
    );

    return successResponse('MOBILE_CHECKED', {
      exists,
      requires_otp: !exists,
    });
  }

  async close(dto: CloseEnquiryDto, authUser?: AuthUser) {
    const enquiry = await this.findById(dto.id);
    if (!enquiry) throw new NotFoundException('Enquiry not found.');
    if (enquiry.status === ENQUIRY_STATUS.CLOSED) {
      throw new BadRequestException('Enquiry is already closed.');
    }
    const closingAstrologerId = await this.getClosingAstrologerId(authUser, dto);

    await this.enquiryRepository.getRepository().update(dto.id, {
      status: ENQUIRY_STATUS.CLOSED,
      close_remark: dto.remark.trim(),
    });

    if (enquiry.customer_id) {
      await this.enquiryRepository.updateCustomerSegment(
        Number(enquiry.customer_id),
        dto.customer_segment,
      );
      if (dto.customer_segment !== CUSTOMER_SEGMENT.OTHER) {
        await this.recordAstrologerConsultCount(enquiry, closingAstrologerId);
      }
    }

    const updated = await this.findById(dto.id);
    return successResponse('ENQUIRY_CLOSED', this.formatEnquiry(updated));
  }

  private async findOrCreateCustomer(dto: CreateEnquiryDto) {
    const existing = await this.enquiryRepository.findActiveUserByMobile(
      dto.country_code,
      dto.mobile,
    );
    if (existing) return existing;

    if (dto.customer_id) return null;

    return this.enquiryRepository.createCustomerUser(dto);
  }

  private async getClosingAstrologerId(authUser: AuthUser | undefined, dto: CloseEnquiryDto) {
    if (dto.customer_segment === CUSTOMER_SEGMENT.OTHER) return null;

    if (!this.shouldScopeToExecutive(authUser)) {
      const astrologerId = Number(dto.astrologer_id);
      if (!Number.isFinite(astrologerId) || astrologerId <= 0) {
        throw new BadRequestException('Astrologer is required.');
      }

      const astrologer = await this.enquiryRepository.findActiveAstrologerById(
        astrologerId,
      );
      if (!astrologer) throw new BadRequestException('Invalid astrologer selected.');

      return astrologerId;
    }

    const userId = Number(authUser?.sub);
    const user = await this.enquiryRepository.findActiveUserById(userId);
    const astrologerId = Number(user?.astrologer_id);

    if (!Number.isFinite(astrologerId) || astrologerId <= 0) {
      throw new BadRequestException(
        'Please connect to admin for assign astrologer first.',
      );
    }

    return astrologerId;
  }

  private async recordAstrologerConsultCount(
    enquiry: EnquiryEntity,
    closingAstrologerId?: number | null,
  ) {
    const assignedExecutive = enquiry.assignments?.find(
      (assignment) => Number(assignment.is_active) === 1,
    )?.executive;
    const astrologerId = Number(
      closingAstrologerId || assignedExecutive?.astrologer_id,
    );
    const customerId = Number(enquiry.customer_id);

    if (!Number.isFinite(astrologerId) || astrologerId <= 0) return;
    if (!Number.isFinite(customerId) || customerId <= 0) return;

    await this.enquiryRepository.upsertAstrologerConsultCount(
      astrologerId,
      customerId,
    );
  }

  private findById(id: number) {
    return this.enquiryRepository.getRepository().findOne({
      where: { id, is_delete: 0 },
      relations: {
        customer: true,
        problem: { translations: true },
        assignments: { executive: true },
      },
    });
  }

  private createFilteredQuery(query: ListEnquiryDto, authUser?: AuthUser) {
    const queryBuilder = this.enquiryRepository
      .getRepository()
      .createQueryBuilder('enquiry')
      .leftJoinAndSelect('enquiry.customer', 'customer')
      .leftJoinAndSelect('enquiry.problem', 'problem')
      .leftJoinAndSelect('problem.translations', 'translation')
      .where('enquiry.is_delete = :isDelete', { isDelete: 0 });

    if (this.shouldScopeToExecutive(authUser)) {
      queryBuilder
        .innerJoin(
          'enquiry.assignments',
          'assignment',
          'assignment.is_active = :assignmentActive',
          { assignmentActive: 1 },
        )
        .andWhere('assignment.executive_id = :executiveId', {
          executiveId: Number(authUser?.sub),
        });
    }

    if (query.status) {
      queryBuilder.andWhere('enquiry.status = :status', {
        status: query.status,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(enquiry.customer_name LIKE :search OR enquiry.mobile LIKE :search OR enquiry.country_code LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.date_from) {
      queryBuilder.andWhere('enquiry.created_at >= :dateFrom', {
        dateFrom: new Date(query.date_from),
      });
    }

    if (query.date_to) {
      queryBuilder.andWhere('enquiry.created_at <= :dateTo', {
        dateTo: new Date(query.date_to),
      });
    }

    return queryBuilder;
  }

  private formatEnquiry(enquiry?: EnquiryEntity | null) {
    if (!enquiry) return null;

    return {
      id: enquiry.id,
      customer_id: enquiry.customer_id,
      customer_name: enquiry.customer_name,
      country_code: enquiry.country_code,
      mobile: enquiry.mobile,
      customer_mobile: `${enquiry.country_code} ${enquiry.mobile}`,
      problem_id: enquiry.problem_id,
      problem_name:
        enquiry.problem_name ||
        this.getEnglishProblemName(enquiry.problem?.translations || []),
      status: enquiry.status,
      close_remark: enquiry.close_remark,
      customer_segment: enquiry.customer?.customer_segment || null,
      created_at: enquiry.created_at,
    };
  }

  private getEnglishProblemName(
    translations: Array<{ lang_code: string; name: string }>,
  ) {
    return (
      translations.find((translation) => translation.lang_code === 'en')?.name ||
      translations[0]?.name ||
      ''
    );
  }

  private getCustomerSegmentLabel(segment?: number | null) {
    if (segment === CUSTOMER_SEGMENT.CONSULTATION_PRODUCT) {
      return 'Consultation + Product';
    }
    if (segment === CUSTOMER_SEGMENT.CONSULTATION_ONLY) {
      return 'Consultation Only';
    }
    if (segment === CUSTOMER_SEGMENT.OTHER) return 'Other';

    return '';
  }

  private shouldScopeToExecutive(authUser?: AuthUser) {
    const userId = Number(authUser?.sub);
    const roleId = Number(authUser?.role_id);
    return Number.isFinite(userId) && userId > 0 && roleId !== ADMIN_ROLE_ID;
  }
}
