import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ServiceTranslationDto } from '../dto/service-translation.dto';
import { ServiceTranslationEntity } from '../entity/service-translation.entity';
import { ServiceEntity } from '../entity/service.entity';

@Injectable()
export class ServiceRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(ServiceEntity)
    private readonly serviceRepository: Repository<ServiceEntity>,
  ) {}

  transaction<T>(callback: (manager: EntityManager) => Promise<T>) {
    return this.dataSource.transaction(callback);
  }

  getServiceRepository(manager?: EntityManager) {
    return manager ? manager.getRepository(ServiceEntity) : this.serviceRepository;
  }

  getTranslationRepository(manager?: EntityManager) {
    return manager
      ? manager.getRepository(ServiceTranslationEntity)
      : this.dataSource.getRepository(ServiceTranslationEntity);
  }

  findActiveCount(manager?: EntityManager) {
    return this.getServiceRepository(manager).count({
      where: { is_delete: 0 },
    });
  }

  findById(id: number, manager?: EntityManager) {
    return this.getServiceRepository(manager).findOne({
      where: { id, is_delete: 0 },
      relations: { translations: true },
    });
  }

  async existsByAnyName(
    names: string[],
    excludeServiceId?: number,
    manager?: EntityManager,
  ) {
    if (!names.length) return false;

    const queryBuilder = this.getTranslationRepository(manager)
      .createQueryBuilder('translation')
      .innerJoin('translation.service', 'service')
      .where('service.is_delete = :isDelete', { isDelete: 0 })
      .andWhere('translation.name IN (:...names)', { names });

    if (excludeServiceId) {
      queryBuilder.andWhere('service.id != :excludeServiceId', {
        excludeServiceId,
      });
    }

    return (await queryBuilder.getCount()) > 0;
  }

  async createService(
    displayOrder: number,
    translations: ServiceTranslationDto[],
    manager: EntityManager,
  ) {
    const serviceRepository = this.getServiceRepository(manager);
    const translationRepository = this.getTranslationRepository(manager);

    const service = await serviceRepository.save(
      serviceRepository.create({
        display_order: displayOrder,
        status: 1,
        is_delete: 0,
      }),
    );

    await translationRepository.save(
      translations.map((translation) =>
        translationRepository.create({
          service_id: service.id,
          lang_code: translation.lang_code,
          name: translation.name,
          description: translation.description || null,
          status: 1,
        }),
      ),
    );

    return this.findById(service.id, manager);
  }

  async upsertTranslations(
    serviceId: number,
    translations: ServiceTranslationDto[],
    manager: EntityManager,
  ) {
    const translationRepository = this.getTranslationRepository(manager);

    for (const translation of translations) {
      const existing = await translationRepository.findOne({
        where: {
          service_id: serviceId,
          lang_code: translation.lang_code,
        },
      });

      if (existing) {
        await translationRepository.update(existing.id, {
          name: translation.name,
          description: translation.description || null,
          status: 1,
        });
      } else {
        await translationRepository.save(
          translationRepository.create({
            service_id: serviceId,
            lang_code: translation.lang_code,
            name: translation.name,
            description: translation.description || null,
            status: 1,
          }),
        );
      }
    }
  }

  async shiftForInsert(displayOrder: number, manager: EntityManager) {
    await this.getServiceRepository(manager)
      .createQueryBuilder()
      .update(ServiceEntity)
      .set({ display_order: () => 'display_order + 1' })
      .where('is_delete = :isDelete', { isDelete: 0 })
      .andWhere('display_order >= :displayOrder', { displayOrder })
      .execute();
  }

  async shiftForUpdate(
    serviceId: number,
    oldOrder: number,
    newOrder: number,
    manager: EntityManager,
  ) {
    if (oldOrder === newOrder) return;

    const builder = this.getServiceRepository(manager)
      .createQueryBuilder()
      .update(ServiceEntity);

    if (newOrder < oldOrder) {
      await builder
        .set({ display_order: () => 'display_order + 1' })
        .where('is_delete = :isDelete', { isDelete: 0 })
        .andWhere('id != :serviceId', { serviceId })
        .andWhere('display_order >= :newOrder', { newOrder })
        .andWhere('display_order < :oldOrder', { oldOrder })
        .execute();
      return;
    }

    await builder
      .set({ display_order: () => 'display_order - 1' })
      .where('is_delete = :isDelete', { isDelete: 0 })
      .andWhere('id != :serviceId', { serviceId })
      .andWhere('display_order <= :newOrder', { newOrder })
      .andWhere('display_order > :oldOrder', { oldOrder })
      .execute();
  }

  async compactDisplayOrder(manager: EntityManager) {
    const services = await this.getServiceRepository(manager).find({
      where: { is_delete: 0 },
      order: { display_order: 'ASC', id: 'ASC' },
    });

    await Promise.all(
      services.map((service, index) =>
        this.getServiceRepository(manager).update(service.id, {
          display_order: index + 1,
        }),
      ),
    );
  }
}
