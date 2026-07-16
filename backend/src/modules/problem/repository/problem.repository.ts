import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ProblemTranslationDto } from '../dto/problem-translation.dto';
import { ProblemTranslationEntity } from '../entity/problem-translation.entity';
import { ProblemEntity } from '../entity/problem.entity';

@Injectable()
export class ProblemRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(ProblemEntity)
    private readonly problemRepository: Repository<ProblemEntity>,
  ) {}

  transaction<T>(callback: (manager: EntityManager) => Promise<T>) {
    return this.dataSource.transaction(callback);
  }

  getProblemRepository(manager?: EntityManager) {
    return manager
      ? manager.getRepository(ProblemEntity)
      : this.problemRepository;
  }

  getTranslationRepository(manager?: EntityManager) {
    return manager
      ? manager.getRepository(ProblemTranslationEntity)
      : this.dataSource.getRepository(ProblemTranslationEntity);
  }

  findActiveCount(manager?: EntityManager) {
    return this.getProblemRepository(manager).count({
      where: { is_delete: 0 },
    });
  }

  findById(id: number, manager?: EntityManager) {
    return this.getProblemRepository(manager).findOne({
      where: { id, is_delete: 0 },
      relations: { translations: true },
    });
  }

  async existsByAnyName(
    names: string[],
    excludeProblemId?: number,
    manager?: EntityManager,
  ) {
    if (!names.length) return false;

    const queryBuilder = this.getTranslationRepository(manager)
      .createQueryBuilder('translation')
      .innerJoin('translation.problem', 'problem')
      .where('problem.is_delete = :isDelete', { isDelete: 0 })
      .andWhere('translation.name IN (:...names)', { names });

    if (excludeProblemId) {
      queryBuilder.andWhere('problem.id != :excludeProblemId', {
        excludeProblemId,
      });
    }

    return (await queryBuilder.getCount()) > 0;
  }

  async createProblem(
    displayOrder: number,
    translations: ProblemTranslationDto[],
    manager: EntityManager,
  ) {
    const problemRepository = this.getProblemRepository(manager);
    const translationRepository = this.getTranslationRepository(manager);

    const problem = await problemRepository.save(
      problemRepository.create({
        display_order: displayOrder,
        status: 1,
        is_delete: 0,
      }),
    );

    await translationRepository.save(
      translations.map((translation) =>
        translationRepository.create({
          problem_id: problem.id,
          lang_code: translation.lang_code,
          name: translation.name,
          status: 1,
        }),
      ),
    );

    return this.findById(problem.id, manager);
  }

  async upsertTranslations(
    problemId: number,
    translations: ProblemTranslationDto[],
    manager: EntityManager,
  ) {
    const translationRepository = this.getTranslationRepository(manager);

    for (const translation of translations) {
      const existing = await translationRepository.findOne({
        where: {
          problem_id: problemId,
          lang_code: translation.lang_code,
        },
      });

      if (existing) {
        await translationRepository.update(existing.id, {
          name: translation.name,
          status: 1,
        });
      } else {
        await translationRepository.save(
          translationRepository.create({
            problem_id: problemId,
            lang_code: translation.lang_code,
            name: translation.name,
            status: 1,
          }),
        );
      }
    }
  }

  async shiftForInsert(displayOrder: number, manager: EntityManager) {
    await this.getProblemRepository(manager)
      .createQueryBuilder()
      .update(ProblemEntity)
      .set({ display_order: () => 'display_order + 1' })
      .where('is_delete = :isDelete', { isDelete: 0 })
      .andWhere('display_order >= :displayOrder', { displayOrder })
      .execute();
  }

  async shiftForUpdate(
    problemId: number,
    oldOrder: number,
    newOrder: number,
    manager: EntityManager,
  ) {
    if (oldOrder === newOrder) return;

    const builder = this.getProblemRepository(manager)
      .createQueryBuilder()
      .update(ProblemEntity);

    if (newOrder < oldOrder) {
      await builder
        .set({ display_order: () => 'display_order + 1' })
        .where('is_delete = :isDelete', { isDelete: 0 })
        .andWhere('id != :problemId', { problemId })
        .andWhere('display_order >= :newOrder', { newOrder })
        .andWhere('display_order < :oldOrder', { oldOrder })
        .execute();
      return;
    }

    await builder
      .set({ display_order: () => 'display_order - 1' })
      .where('is_delete = :isDelete', { isDelete: 0 })
      .andWhere('id != :problemId', { problemId })
      .andWhere('display_order <= :newOrder', { newOrder })
      .andWhere('display_order > :oldOrder', { oldOrder })
      .execute();
  }

  async compactDisplayOrder(manager: EntityManager) {
    const problems = await this.getProblemRepository(manager).find({
      where: { is_delete: 0 },
      order: { display_order: 'ASC', id: 'ASC' },
    });

    await Promise.all(
      problems.map((problem, index) =>
        this.getProblemRepository(manager).update(problem.id, {
          display_order: index + 1,
        }),
      ),
    );
  }
}
