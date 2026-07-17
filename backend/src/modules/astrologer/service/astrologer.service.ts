import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { successResponse } from '../../../common/helpers/response.helper';
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
  constructor(private readonly astrologerRepository: AstrologerRepository) {}

  async create(dto: CreateAstrologerDto) {
    this.validateTranslations(dto.translations);
    const translations = this.normalizeTranslations(dto.translations);

    const astrologer = await this.astrologerRepository.transaction(
      async (manager) => {
        await this.ensureUniqueNames(translations, undefined, manager);

        return this.astrologerRepository.createAstrologer(
          {
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

    const [astrologers, total] = await queryBuilder
      .orderBy('astrologer.id', 'DESC')
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

    return successResponse('ASTROLOGER_PUBLIC_LIST_FETCHED', {
      records: astrologers.map((astrologer) =>
        this.formatPublicAstrologer(astrologer),
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
      name: english?.name || '',
      description: english?.description || '',
      expertise: english?.expertise || '',
      experience: astrologer.experience,
      languages: astrologer.languages,
      rating: astrologer.rating,
      consultations: astrologer.consultations,
      status: astrologer.status,
      all_names: translations.map((translation) => ({
        label: translation.lang_code.toUpperCase(),
        value: translation.name,
        expertise: translation.expertise,
        description: translation.description || '',
      })),
    };
  }

  private formatPublicAstrologer(astrologer: AstrologerEntity) {
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
      consultations: astrologer.consultations,
    };
  }
}
