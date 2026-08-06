import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { EntityManager } from 'typeorm';
import { successResponse } from '../../../common/helpers/response.helper';
import { AstrologerStatusService } from '../../astrologer-status/service/astrologer-status.service';
import { AstrologerTranslationDto } from '../dto/astrologer-translation.dto';
import { CreateAstrologerDto } from '../dto/create-astrologer.dto';
import { DeleteAstrologerDto } from '../dto/delete-astrologer.dto';
import { ListAstrologerDto } from '../dto/list-astrologer.dto';
import { UpdateAstrologerStatusDto } from '../dto/update-astrologer-status.dto';
import { UpdateAstrologerDto } from '../dto/update-astrologer.dto';
import { AstrologerEntity } from '../entity/astrologer.entity';
import { AstrologerRepository } from '../repository/astrologer.repository';

@Injectable()
export class AstrologerService {
  private readonly uploadDir = join(
    process.cwd(),
    'public',
    'uploads',
    'astrologers',
  );
  private readonly allowedImageTypes = new Map([
    ['image/jpeg', '.jpg'],
    ['image/png', '.png'],
    ['image/webp', '.webp'],
    ['image/gif', '.gif'],
  ]);

  constructor(
    private readonly astrologerRepository: AstrologerRepository,
    private readonly astrologerStatusService: AstrologerStatusService,
  ) {}

  async create(dto: CreateAstrologerDto) {
    this.validateTranslations(dto.translations);
    const translations = this.normalizeTranslations(dto.translations);

    const astrologer = await this.astrologerRepository.transaction(
      async (manager) => {
        await this.ensureUniqueNames(translations, undefined, manager);

        return this.astrologerRepository.createAstrologer(
          {
            image: this.cleanImageUrl(dto.image),
            experience: dto.experience.trim(),
            languages: this.cleanCommaText(dto.languages),
            rating: dto.rating ?? 0,
            consultations: dto.consultations?.trim() || '0',
          },
          translations,
          manager,
        );
      },
    );

    return successResponse('ASTROLOGER_CREATED', this.formatAstrologer(astrologer));
  }

  async findAll(query: ListAstrologerDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const skip = (page - 1) * limit;
    const sortOrder = query.sort_order === 'asc' ? 'ASC' : 'DESC';

    const queryBuilder = this.astrologerRepository
      .getAstrologerRepository()
      .createQueryBuilder('astrologer')
      .leftJoinAndSelect('astrologer.translations', 'translation')
      .where('astrologer.is_delete = :isDelete', { isDelete: 0 });

    if (query.status !== undefined) {
      queryBuilder.andWhere('astrologer.status = :status', {
        status: query.status,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        `(
          translation.name LIKE :search
          OR translation.expertise LIKE :search
          OR translation.description LIKE :search
          OR astrologer.experience LIKE :search
          OR astrologer.languages LIKE :search
        )`,
        { search: `%${query.search}%` },
      );
    }

    if (query.date_from) {
      queryBuilder.andWhere('astrologer.created_at >= :dateFrom', {
        dateFrom: new Date(query.date_from),
      });
    }

    if (query.date_to) {
      queryBuilder.andWhere('astrologer.created_at <= :dateTo', {
        dateTo: new Date(query.date_to),
      });
    }

    const [astrologers, total] = await queryBuilder
      .orderBy('astrologer.id', sortOrder)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return successResponse('ASTROLOGER_LIST_FETCHED', {
      records: astrologers.map((astrologer) =>
        this.formatAstrologer(astrologer),
      ),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  }

  async update(dto: UpdateAstrologerDto) {
    if (dto.translations) this.validateTranslations(dto.translations);
    const translations = dto.translations
      ? this.normalizeTranslations(dto.translations)
      : undefined;

    const astrologer = await this.astrologerRepository.transaction(
      async (manager) => {
        const existing = await this.astrologerRepository.findById(
          dto.id,
          manager,
        );
        if (!existing) throw new NotFoundException('Astrologer not found.');

        if (translations) {
          await this.ensureUniqueNames(translations, dto.id, manager);
        }

        await this.astrologerRepository.getAstrologerRepository(manager).update(
          dto.id,
          {
            image:
              dto.image === undefined
                ? existing.image
                : this.cleanImageUrl(dto.image),
            experience:
              dto.experience === undefined
                ? existing.experience
                : dto.experience.trim(),
            languages:
              dto.languages === undefined
                ? existing.languages
                : this.cleanCommaText(dto.languages),
            rating: dto.rating === undefined ? existing.rating : dto.rating,
            consultations:
              dto.consultations === undefined
                ? existing.consultations
                : dto.consultations.trim() || '0',
          },
        );

        if (translations) {
          await this.astrologerRepository.upsertTranslations(
            dto.id,
            translations,
            manager,
          );
        }

        return this.astrologerRepository.findById(dto.id, manager);
      },
    );

    return successResponse('ASTROLOGER_UPDATED', this.formatAstrologer(astrologer));
  }

  async uploadImage(file: any, request: Request) {
    if (!file) throw new BadRequestException('Image file is required.');

    const extension = this.allowedImageTypes.get(file.mimetype);
    if (!extension) {
      throw new BadRequestException('Please upload a valid image file.');
    }

    const originalExtension = extname(file.originalname || '').toLowerCase();
    const filename = `${Date.now()}-${randomUUID()}${
      originalExtension || extension
    }`;

    await mkdir(this.uploadDir, { recursive: true });
    await writeFile(join(this.uploadDir, filename), file.buffer);

    const path = `/uploads/astrologers/${filename}`;

    return successResponse('ASTROLOGER_IMAGE_UPLOADED', {
      url: `${this.getPublicBaseUrl(request)}${path}`,
      path,
    });
  }

  async updateStatus(dto: UpdateAstrologerStatusDto) {
    const astrologer = await this.astrologerRepository.findById(dto.id);
    if (!astrologer) throw new NotFoundException('Astrologer not found.');

    await this.astrologerRepository.getAstrologerRepository().update(dto.id, {
      status: dto.status,
    });

    const updatedAstrologer = await this.astrologerRepository.findById(dto.id);
    return successResponse(
      'ASTROLOGER_STATUS_UPDATED',
      this.formatAstrologer(updatedAstrologer),
    );
  }

  async publicList(query: ListAstrologerDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 8, 100);
    const skip = (page - 1) * limit;

    const queryBuilder = this.astrologerRepository
      .getAstrologerRepository()
      .createQueryBuilder('astrologer')
      .leftJoinAndSelect('astrologer.translations', 'translation')
      .where('astrologer.is_delete = :isDelete', { isDelete: 0 })
      .andWhere('astrologer.status = :status', { status: 1 });

    if (query.search) {
      queryBuilder.andWhere(
        `(
          translation.name LIKE :search
          OR translation.expertise LIKE :search
          OR translation.description LIKE :search
          OR astrologer.experience LIKE :search
          OR astrologer.languages LIKE :search
        )`,
        { search: `%${query.search}%` },
      );
    }

    const [astrologers, total] = await queryBuilder
      .orderBy('astrologer.id', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    const consultCountMap =
      await this.astrologerRepository.getConsultCountsByAstrologerIds(
        astrologers.map((astrologer) => Number(astrologer.id)),
      );
    const live = await this.astrologerStatusService.isLive();

    return successResponse('ASTROLOGER_PUBLIC_LIST_FETCHED', {
      records: astrologers.map((astrologer) =>
        this.formatPublicAstrologer(
          astrologer,
          consultCountMap.get(Number(astrologer.id)) || 0,
          live,
        ),
      ),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  }

  async delete(dto: DeleteAstrologerDto) {
    const astrologer = await this.astrologerRepository.findById(dto.id);
    if (!astrologer) throw new NotFoundException('Astrologer not found.');

    await this.astrologerRepository.getAstrologerRepository().update(dto.id, {
      is_delete: 1,
    });

    return successResponse('ASTROLOGER_DELETED');
  }

  private validateTranslations(translations: AstrologerTranslationDto[]) {
    const languageCodes = new Set(translations.map((item) => item.lang_code));
    if (!languageCodes.has('en') || !languageCodes.has('hi')) {
      throw new BadRequestException(
        'English and Hindi astrologer names are required.',
      );
    }

    const hasBlankName = translations.some(
      (translation) => !translation.name?.trim(),
    );
    if (hasBlankName) {
      throw new BadRequestException(
        'All language astrologer names are required.',
      );
    }

    const hasBlankExpertise = translations.some(
      (translation) => !this.cleanCommaText(translation.expertise || '', false),
    );
    if (hasBlankExpertise) {
      throw new BadRequestException(
        'All language astrologer expertise values are required.',
      );
    }
  }

  private getTranslationNames(translations: AstrologerTranslationDto[]) {
    return translations
      .map((translation) => translation.name.trim())
      .filter(Boolean);
  }

  private async ensureUniqueNames(
    translations: AstrologerTranslationDto[],
    excludeAstrologerId?: number,
    manager?: EntityManager,
  ) {
    const names = this.getTranslationNames(translations);
    const normalizedNames = names.map((name) => name.toLowerCase());

    if (new Set(normalizedNames).size !== normalizedNames.length) {
      throw new BadRequestException('Duplicate astrologer name is not allowed.');
    }

    const exists = await this.astrologerRepository.existsByAnyName(
      names,
      excludeAstrologerId,
      manager,
    );

    if (exists) {
      throw new BadRequestException('Astrologer name already exists.');
    }
  }

  private normalizeTranslations(translations: AstrologerTranslationDto[]) {
    return translations.map((translation) => ({
      ...translation,
      name: translation.name.trim(),
      expertise: this.cleanCommaText(translation.expertise),
      description: translation.description?.trim(),
    }));
  }

  private cleanCommaText(value: string, throwOnBlank = true) {
    const cleaned = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .join(', ');

    if (!cleaned && throwOnBlank) {
      throw new BadRequestException('Comma separated value is required.');
    }
    return cleaned;
  }

  private cleanOptionalText(value?: string) {
    const cleaned = value?.trim();
    return cleaned || null;
  }

  private cleanImageUrl(value?: string) {
    const cleaned = this.cleanOptionalText(value);
    if (cleaned?.startsWith('data:')) {
      throw new BadRequestException('Please upload image file instead of base64.');
    }

    const uploadPathIndex = cleaned?.indexOf('/uploads/') ?? -1;
    if (uploadPathIndex >= 0) return cleaned?.slice(uploadPathIndex);

    return cleaned;
  }

  private getPublicBaseUrl(request: Request) {
    const configuredBaseUrl = process.env.PUBLIC_BASE_URL?.trim();
    if (configuredBaseUrl) return configuredBaseUrl.replace(/\/$/, '');

    const forwardedProtocol = request.get('x-forwarded-proto')?.split(',')[0];
    const protocol = forwardedProtocol || request.protocol;
    const host = request.get('host');

    return `${protocol}://${host}`;
  }

  private formatAstrologer(astrologer?: AstrologerEntity | null) {
    if (!astrologer) return null;

    const translations = [...(astrologer.translations || [])].sort((a, b) =>
      a.lang_code.localeCompare(b.lang_code),
    );
    const english =
      translations.find((translation) => translation.lang_code === 'en') ||
      translations[0];

    return {
      id: astrologer.id,
      image: astrologer.image || '',
      name: english?.name || '',
      description: english?.description || '',
      expertise: english?.expertise || '',
      experience: astrologer.experience,
      languages: astrologer.languages,
      rating: astrologer.rating,
      consultations: astrologer.consultations,
      status: astrologer.status,
      created_at: astrologer.created_at,
      all_names: translations.map((translation) => ({
        label: translation.lang_code.toUpperCase(),
        value: translation.name,
        expertise: translation.expertise,
        description: translation.description || '',
      })),
    };
  }

  private formatPublicAstrologer(
    astrologer: AstrologerEntity,
    consultCount = 0,
    live = false,
  ) {
    const translations = astrologer.translations || [];
    const english = translations.find(
      (translation) => translation.lang_code === 'en',
    );
    const hindi = translations.find(
      (translation) => translation.lang_code === 'hi',
    );
    const fallback = english || hindi || translations[0];

    return {
      id: astrologer.id,
      image: astrologer.image || '',
      en_name: english?.name || fallback?.name || '',
      hi_name: hindi?.name || english?.name || fallback?.name || '',
      en_description: english?.description || fallback?.description || '',
      hi_description:
        hindi?.description || english?.description || fallback?.description || '',
      en_expertise: english?.expertise || fallback?.expertise || '',
      hi_expertise: hindi?.expertise || english?.expertise || fallback?.expertise || '',
      experience: astrologer.experience,
      languages: astrologer.languages,
      rating: astrologer.rating,
      consultations: String(
        this.toConsultationCount(astrologer.consultations) + consultCount,
      ),
      live,
    };
  }

  private toConsultationCount(value?: string | null) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;

    const parsed = Number.parseInt(String(value || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
