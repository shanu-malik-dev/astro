import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AstrologerTranslationDto } from '../dto/astrologer-translation.dto';
import { AstrologerConsultCountEntity } from '../entity/astrologer-consult-count.entity';
import { AstrologerTranslationEntity } from '../entity/astrologer-translation.entity';
import { AstrologerEntity } from '../entity/astrologer.entity';

@Injectable()
export class AstrologerRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(AstrologerEntity)
    private readonly astrologerRepository: Repository<AstrologerEntity>,
  ) {}

  transaction<T>(callback: (manager: EntityManager) => Promise<T>) {
    return this.dataSource.transaction(callback);
  }

  getAstrologerRepository(manager?: EntityManager) {
    return manager
      ? manager.getRepository(AstrologerEntity)
      : this.astrologerRepository;
  }

  getTranslationRepository(manager?: EntityManager) {
    return manager
      ? manager.getRepository(AstrologerTranslationEntity)
      : this.dataSource.getRepository(AstrologerTranslationEntity);
  }

  async getConsultCountsByAstrologerIds(astrologerIds: number[]) {
    if (astrologerIds.length === 0) return new Map<number, number>();

    const rows = await this.dataSource
      .getRepository(AstrologerConsultCountEntity)
      .createQueryBuilder('consultCount')
      .select('consultCount.astrologer_id', 'astrologer_id')
      .addSelect('SUM(consultCount.consult_count)', 'consult_count')
      .where('consultCount.astrologer_id IN (:...astrologerIds)', {
        astrologerIds,
      })
      .groupBy('consultCount.astrologer_id')
      .getRawMany<{ astrologer_id: string; consult_count: string }>();

    return rows.reduce<Map<number, number>>((map, row) => {
      map.set(Number(row.astrologer_id), Number(row.consult_count) || 0);
      return map;
    }, new Map<number, number>());
  }

  findById(id: number, manager?: EntityManager) {
    return this.getAstrologerRepository(manager).findOne({
      where: { id, is_delete: 0 },
      relations: { translations: true },
    });
  }

  async existsByAnyName(
    names: string[],
    excludeAstrologerId?: number,
    manager?: EntityManager,
  ) {
    if (!names.length) return false;

    const queryBuilder = this.getTranslationRepository(manager)
      .createQueryBuilder('translation')
      .innerJoin('translation.astrologer', 'astrologer')
      .where('astrologer.is_delete = :isDelete', { isDelete: 0 })
      .andWhere('translation.name IN (:...names)', { names });

    if (excludeAstrologerId) {
      queryBuilder.andWhere('astrologer.id != :excludeAstrologerId', {
        excludeAstrologerId,
      });
    }

    return (await queryBuilder.getCount()) > 0;
  }

  async createAstrologer(
    payload: Pick<
      AstrologerEntity,
      'image' | 'experience' | 'languages' | 'rating' | 'consultations'
    >,
    translations: AstrologerTranslationDto[],
    manager: EntityManager,
  ) {
    const astrologerRepository = this.getAstrologerRepository(manager);
    const translationRepository = this.getTranslationRepository(manager);

    const astrologer = await astrologerRepository.save(
      astrologerRepository.create({
        ...payload,
        status: 1,
        is_delete: 0,
      }),
    );

    await translationRepository.save(
      translations.map((translation) =>
        translationRepository.create({
          astrologer_id: astrologer.id,
          lang_code: translation.lang_code,
          name: translation.name,
          expertise: translation.expertise,
          description: translation.description || null,
          status: 1,
        }),
      ),
    );

    return this.findById(astrologer.id, manager);
  }

  async upsertTranslations(
    astrologerId: number,
    translations: AstrologerTranslationDto[],
    manager: EntityManager,
  ) {
    const translationRepository = this.getTranslationRepository(manager);

    for (const translation of translations) {
      const existing = await translationRepository.findOne({
        where: {
          astrologer_id: astrologerId,
          lang_code: translation.lang_code,
        },
      });

      if (existing) {
        await translationRepository.update(existing.id, {
          name: translation.name,
          expertise: translation.expertise,
          description: translation.description || null,
          status: 1,
        });
      } else {
        await translationRepository.save(
          translationRepository.create({
            astrologer_id: astrologerId,
            lang_code: translation.lang_code,
            name: translation.name,
            expertise: translation.expertise,
            description: translation.description || null,
            status: 1,
          }),
        );
      }
    }
  }
}
