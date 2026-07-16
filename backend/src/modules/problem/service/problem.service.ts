import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { successResponse } from '../../../common/helpers/response.helper';
import { CreateProblemDto } from '../dto/create-problem.dto';
import { DeleteProblemDto } from '../dto/delete-problem.dto';
import { ListProblemDto } from '../dto/list-problem.dto';
import { UpdateProblemStatusDto } from '../dto/update-problem-status.dto';
import { UpdateProblemDto } from '../dto/update-problem.dto';
import { ProblemTranslationDto } from '../dto/problem-translation.dto';
import { ProblemEntity } from '../entity/problem.entity';
import { ProblemRepository } from '../repository/problem.repository';

@Injectable()
export class ProblemService {
  constructor(private readonly problemRepository: ProblemRepository) {}

  async create(dto: CreateProblemDto) {
    this.validateTranslations(dto.translations);

    const problem = await this.problemRepository.transaction(async (manager) => {
      await this.ensureUniqueNames(dto.translations, undefined, manager);

      const total = await this.problemRepository.findActiveCount(manager);
      const maxDisplayOrder = total + 1;
      if (dto.display_order && dto.display_order !== maxDisplayOrder) {
        throw new BadRequestException(
          `Display order must be ${maxDisplayOrder}.`,
        );
      }
      const displayOrder = dto.display_order || maxDisplayOrder;

      await this.problemRepository.shiftForInsert(displayOrder, manager);

      return this.problemRepository.createProblem(
        displayOrder,
        dto.translations,
        manager,
      );
    });

    return successResponse('PROBLEM_CREATED', this.formatProblem(problem));
  }

  async findAll(query: ListProblemDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const skip = (page - 1) * limit;

    const queryBuilder = this.problemRepository
      .getProblemRepository()
      .createQueryBuilder('problem')
      .leftJoinAndSelect('problem.translations', 'translation')
      .where('problem.is_delete = :isDelete', { isDelete: 0 });

    if (query.status !== undefined) {
      queryBuilder.andWhere('problem.status = :status', {
        status: query.status,
      });
    }

    if (query.search) {
      queryBuilder.andWhere('translation.name LIKE :search', {
        search: `%${query.search}%`,
      });
    }

    const [problems, total] = await queryBuilder
      .orderBy('problem.display_order', 'ASC')
      .addOrderBy('problem.id', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return successResponse('PROBLEM_LIST_FETCHED', {
      records: problems.map((problem) => this.formatProblem(problem)),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  }

  async dropdown() {
    const problems = await this.problemRepository
      .getProblemRepository()
      .createQueryBuilder('problem')
      .leftJoinAndSelect('problem.translations', 'translation')
      .where('problem.is_delete = :isDelete', { isDelete: 0 })
      .andWhere('problem.status = :status', { status: 1 })
      .orderBy('problem.display_order', 'ASC')
      .addOrderBy('problem.id', 'ASC')
      .getMany();

    return successResponse(
      'PROBLEM_DROPDOWN_FETCHED',
      problems.map((problem) => {
        const translations = problem.translations || [];
        const englishLabel =
          translations.find((translation) => translation.lang_code === 'en')
            ?.name ||
          translations[0]?.name ||
          '';
        const hindiLabel =
          translations.find((translation) => translation.lang_code === 'hi')
            ?.name || englishLabel;

        return {
          value: problem.id,
          en_label: englishLabel,
          hi_label: hindiLabel,
        };
      }),
    );
  }

  async update(dto: UpdateProblemDto) {
    if (dto.translations) this.validateTranslations(dto.translations);

    const problem = await this.problemRepository.transaction(async (manager) => {
      const existing = await this.problemRepository.findById(dto.id, manager);
      if (!existing) throw new NotFoundException('Problem not found.');

      if (dto.translations) {
        await this.ensureUniqueNames(dto.translations, dto.id, manager);
      }

      const total = await this.problemRepository.findActiveCount(manager);
      if (dto.display_order && dto.display_order > total) {
        throw new BadRequestException(
          `Display order must be between 1 and ${total}.`,
        );
      }
      const nextOrder = dto.display_order
        ? dto.display_order
        : existing.display_order;

      await this.problemRepository.shiftForUpdate(
        existing.id,
        existing.display_order,
        nextOrder,
        manager,
      );

      await this.problemRepository.getProblemRepository(manager).update(dto.id, {
        display_order: nextOrder,
      });

      if (dto.translations) {
        await this.problemRepository.upsertTranslations(
          dto.id,
          dto.translations,
          manager,
        );
      }

      await this.problemRepository.compactDisplayOrder(manager);

      return this.problemRepository.findById(dto.id, manager);
    });

    return successResponse('PROBLEM_UPDATED', this.formatProblem(problem));
  }

  async updateStatus(dto: UpdateProblemStatusDto) {
    const problem = await this.problemRepository.findById(dto.id);
    if (!problem) throw new NotFoundException('Problem not found.');

    await this.problemRepository.getProblemRepository().update(dto.id, {
      status: dto.status,
    });

    const updatedProblem = await this.problemRepository.findById(dto.id);
    return successResponse(
      'PROBLEM_STATUS_UPDATED',
      this.formatProblem(updatedProblem),
    );
  }

  async delete(dto: DeleteProblemDto) {
    await this.problemRepository.transaction(async (manager) => {
      const problem = await this.problemRepository.findById(dto.id, manager);
      if (!problem) throw new NotFoundException('Problem not found.');

      await this.problemRepository.getProblemRepository(manager).update(dto.id, {
        is_delete: 1,
      });
      await this.problemRepository.compactDisplayOrder(manager);
    });

    return successResponse('PROBLEM_DELETED');
  }

  private validateTranslations(translations: ProblemTranslationDto[]) {
    const languageCodes = new Set(translations.map((item) => item.lang_code));
    if (!languageCodes.has('en') || !languageCodes.has('hi')) {
      throw new BadRequestException('English and Hindi names are required.');
    }

    const hasBlankName = translations.some(
      (translation) => !translation.name?.trim(),
    );
    if (hasBlankName) {
      throw new BadRequestException('All language names are required.');
    }
  }

  private getTranslationNames(translations: ProblemTranslationDto[]) {
    return translations
      .map((translation) => translation.name.trim())
      .filter(Boolean);
  }

  private async ensureUniqueNames(
    translations: ProblemTranslationDto[],
    excludeProblemId?: number,
    manager?: Parameters<ProblemRepository['findById']>[1],
  ) {
    const names = this.getTranslationNames(translations);
    const normalizedNames = names.map((name) => name.toLowerCase());

    if (new Set(normalizedNames).size !== normalizedNames.length) {
      throw new BadRequestException('Duplicate problem name is not allowed.');
    }

    const exists = await this.problemRepository.existsByAnyName(
      names,
      excludeProblemId,
      manager,
    );

    if (exists) {
      throw new BadRequestException('Problem name already exists.');
    }
  }

  private formatProblem(problem?: ProblemEntity | null) {
    if (!problem) return null;

    const translations = [...(problem.translations || [])].sort((a, b) =>
      a.lang_code.localeCompare(b.lang_code),
    );
    const englishName =
      translations.find((translation) => translation.lang_code === 'en')?.name ||
      translations[0]?.name ||
      '';

    return {
      id: problem.id,
      name: englishName,
      status: problem.status,
      display_order: problem.display_order,
      all_names: translations.map((translation) => ({
        label: translation.lang_code.toUpperCase(),
        value: translation.name,
      })),
    };
  }
}
