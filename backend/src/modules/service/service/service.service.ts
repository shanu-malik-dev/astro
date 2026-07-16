import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { successResponse } from '../../../common/helpers/response.helper';
import { CreateServiceDto } from '../dto/create-service.dto';
import { DeleteServiceDto } from '../dto/delete-service.dto';
import { ListServiceDto } from '../dto/list-service.dto';
import { ServiceTranslationDto } from '../dto/service-translation.dto';
import { UpdateServiceStatusDto } from '../dto/update-service-status.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { ServiceEntity } from '../entity/service.entity';
import { ServiceRepository } from '../repository/service.repository';

@Injectable()
export class ServiceService {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async create(dto: CreateServiceDto) {
    this.validateTranslations(dto.translations);

    const service = await this.serviceRepository.transaction(async (manager) => {
      await this.ensureUniqueNames(dto.translations, undefined, manager);

      const total = await this.serviceRepository.findActiveCount(manager);
      const maxDisplayOrder = total + 1;
      if (dto.display_order && dto.display_order !== maxDisplayOrder) {
        throw new BadRequestException(
          `Display order must be ${maxDisplayOrder}.`,
        );
      }
      const displayOrder = dto.display_order || maxDisplayOrder;

      await this.serviceRepository.shiftForInsert(displayOrder, manager);

      return this.serviceRepository.createService(
        displayOrder,
        dto.translations,
        manager,
      );
    });

    return successResponse('SERVICE_CREATED', this.formatService(service));
  }

  async findAll(query: ListServiceDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const skip = (page - 1) * limit;

    const queryBuilder = this.serviceRepository
      .getServiceRepository()
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.translations', 'translation')
      .where('service.is_delete = :isDelete', { isDelete: 0 });

    if (query.status !== undefined) {
      queryBuilder.andWhere('service.status = :status', {
        status: query.status,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(translation.name LIKE :search OR translation.description LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [services, total] = await queryBuilder
      .orderBy('service.display_order', 'ASC')
      .addOrderBy('service.id', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return successResponse('SERVICE_LIST_FETCHED', {
      records: services.map((service) => this.formatService(service)),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  }

  async update(dto: UpdateServiceDto) {
    if (dto.translations) this.validateTranslations(dto.translations);

    const service = await this.serviceRepository.transaction(async (manager) => {
      const existing = await this.serviceRepository.findById(dto.id, manager);
      if (!existing) throw new NotFoundException('Service not found.');

      if (dto.translations) {
        await this.ensureUniqueNames(dto.translations, dto.id, manager);
      }

      const total = await this.serviceRepository.findActiveCount(manager);
      if (dto.display_order && dto.display_order > total) {
        throw new BadRequestException(
          `Display order must be between 1 and ${total}.`,
        );
      }
      const nextOrder = dto.display_order
        ? dto.display_order
        : existing.display_order;

      await this.serviceRepository.shiftForUpdate(
        existing.id,
        existing.display_order,
        nextOrder,
        manager,
      );

      await this.serviceRepository.getServiceRepository(manager).update(dto.id, {
        display_order: nextOrder,
      });

      if (dto.translations) {
        await this.serviceRepository.upsertTranslations(
          dto.id,
          dto.translations,
          manager,
        );
      }

      await this.serviceRepository.compactDisplayOrder(manager);

      return this.serviceRepository.findById(dto.id, manager);
    });

    return successResponse('SERVICE_UPDATED', this.formatService(service));
  }

  async updateStatus(dto: UpdateServiceStatusDto) {
    const service = await this.serviceRepository.findById(dto.id);
    if (!service) throw new NotFoundException('Service not found.');

    await this.serviceRepository.getServiceRepository().update(dto.id, {
      status: dto.status,
    });

    const updatedService = await this.serviceRepository.findById(dto.id);
    return successResponse(
      'SERVICE_STATUS_UPDATED',
      this.formatService(updatedService),
    );
  }

  async delete(dto: DeleteServiceDto) {
    await this.serviceRepository.transaction(async (manager) => {
      const service = await this.serviceRepository.findById(dto.id, manager);
      if (!service) throw new NotFoundException('Service not found.');

      await this.serviceRepository.getServiceRepository(manager).update(dto.id, {
        is_delete: 1,
      });
      await this.serviceRepository.compactDisplayOrder(manager);
    });

    return successResponse('SERVICE_DELETED');
  }

  private validateTranslations(translations: ServiceTranslationDto[]) {
    const languageCodes = new Set(translations.map((item) => item.lang_code));
    if (!languageCodes.has('en') || !languageCodes.has('hi')) {
      throw new BadRequestException('English and Hindi service names are required.');
    }

    const hasBlankName = translations.some(
      (translation) => !translation.name?.trim(),
    );
    if (hasBlankName) {
      throw new BadRequestException('All language service names are required.');
    }
  }

  private getTranslationNames(translations: ServiceTranslationDto[]) {
    return translations
      .map((translation) => translation.name.trim())
      .filter(Boolean);
  }

  private async ensureUniqueNames(
    translations: ServiceTranslationDto[],
    excludeServiceId?: number,
    manager?: Parameters<ServiceRepository['findById']>[1],
  ) {
    const names = this.getTranslationNames(translations);
    const normalizedNames = names.map((name) => name.toLowerCase());

    if (new Set(normalizedNames).size !== normalizedNames.length) {
      throw new BadRequestException('Duplicate service name is not allowed.');
    }

    const exists = await this.serviceRepository.existsByAnyName(
      names,
      excludeServiceId,
      manager,
    );

    if (exists) {
      throw new BadRequestException('Service name already exists.');
    }
  }

  private formatService(service?: ServiceEntity | null) {
    if (!service) return null;

    const translations = [...(service.translations || [])].sort((a, b) =>
      a.lang_code.localeCompare(b.lang_code),
    );
    const english =
      translations.find((translation) => translation.lang_code === 'en') ||
      translations[0];

    return {
      id: service.id,
      name: english?.name || '',
      description: english?.description || '',
      status: service.status,
      display_order: service.display_order,
      all_names: translations.map((translation) => ({
        label: translation.lang_code.toUpperCase(),
        value: translation.name,
        description: translation.description || '',
      })),
    };
  }
}
