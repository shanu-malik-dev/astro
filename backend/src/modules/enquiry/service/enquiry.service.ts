import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { successResponse } from '../../../common/helpers/response.helper';
import { CloseEnquiryDto } from '../dto/close-enquiry.dto';
import { CreateEnquiryDto } from '../dto/create-enquiry.dto';
import { ListEnquiryDto } from '../dto/list-enquiry.dto';
import { EnquiryEntity } from '../entity/enquiry.entity';
import { EnquiryRepository } from '../repository/enquiry.repository';

@Injectable()
export class EnquiryService {
  constructor(private readonly enquiryRepository: EnquiryRepository) {}

  async create(dto: CreateEnquiryDto) {
    const problem = await this.enquiryRepository.findProblemById(dto.problem_id);
    if (!problem) throw new NotFoundException('Problem not found.');

    const exists = await this.enquiryRepository.existsOpenEnquiry(dto);
    if (exists) {
      throw new BadRequestException(
        'An open enquiry already exists for this customer and problem.',
      );
    }

    const problemName =
      dto.problem_name?.trim() ||
      this.getEnglishProblemName(problem.translations || []);
    const enquiry = await this.enquiryRepository.createEnquiry(dto, problemName);
    const created = await this.findById(enquiry.id);

    return successResponse('ENQUIRY_CREATED', this.formatEnquiry(created));
  }

  async findAll(query: ListEnquiryDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const skip = (page - 1) * limit;

    const queryBuilder = this.enquiryRepository
      .getRepository()
      .createQueryBuilder('enquiry')
      .leftJoinAndSelect('enquiry.problem', 'problem')
      .leftJoinAndSelect('problem.translations', 'translation')
      .where('enquiry.is_delete = :isDelete', { isDelete: 0 });

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

  async close(dto: CloseEnquiryDto) {
    const enquiry = await this.findById(dto.id);
    if (!enquiry) throw new NotFoundException('Enquiry not found.');
    if (enquiry.status === 'closed') {
      throw new BadRequestException('Enquiry is already closed.');
    }

    await this.enquiryRepository.getRepository().update(dto.id, {
      status: 'closed',
      close_remark: dto.remark.trim(),
    });

    const updated = await this.findById(dto.id);
    return successResponse('ENQUIRY_CLOSED', this.formatEnquiry(updated));
  }

  private findById(id: number) {
    return this.enquiryRepository.getRepository().findOne({
      where: { id, is_delete: 0 },
      relations: { problem: { translations: true } },
    });
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
}
