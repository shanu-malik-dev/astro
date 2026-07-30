import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ProductTranslationDto } from '../dto/product-translation.dto';
import { ProductTranslationEntity } from '../entity/product-translation.entity';
import { ProductEntity } from '../entity/product.entity';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  transaction<T>(callback: (manager: EntityManager) => Promise<T>) {
    return this.dataSource.transaction(callback);
  }

  getProductRepository(manager?: EntityManager) {
    return manager ? manager.getRepository(ProductEntity) : this.productRepository;
  }

  getTranslationRepository(manager?: EntityManager) {
    return manager
      ? manager.getRepository(ProductTranslationEntity)
      : this.dataSource.getRepository(ProductTranslationEntity);
  }

  findActiveCount(manager?: EntityManager) {
    return this.getProductRepository(manager).count({
      where: { is_delete: 0 },
    });
  }

  findById(id: number, manager?: EntityManager) {
    return this.getProductRepository(manager).findOne({
      where: { id, is_delete: 0 },
      relations: { translations: true },
    });
  }

  findPublicById(id: number) {
    return this.getProductRepository().findOne({
      where: { id, is_delete: 0, status: 1 },
      relations: { translations: true },
    });
  }

  async existsByCode(code: string, excludeProductId?: number, manager?: EntityManager) {
    const queryBuilder = this.getProductRepository(manager)
      .createQueryBuilder('product')
      .where('product.is_delete = :isDelete', { isDelete: 0 })
      .andWhere('LOWER(product.product_code) = LOWER(:code)', { code });

    if (excludeProductId) {
      queryBuilder.andWhere('product.id != :excludeProductId', {
        excludeProductId,
      });
    }

    return (await queryBuilder.getCount()) > 0;
  }

  async createProduct(
    input: {
      product_code: string;
      product_image: string;
      product_price: number;
      display_order: number;
    },
    translations: ProductTranslationDto[],
    manager: EntityManager,
  ) {
    const productRepository = this.getProductRepository(manager);
    const translationRepository = this.getTranslationRepository(manager);

    const product = await productRepository.save(
      productRepository.create({
        product_code: input.product_code,
        product_image: input.product_image,
        product_price: input.product_price.toFixed(2),
        display_order: input.display_order,
        status: 1,
        is_delete: 0,
      }),
    );

    await translationRepository.save(
      translations.map((translation) =>
        translationRepository.create({
          product_id: product.id,
          lang_code: translation.lang_code,
          name: translation.name,
          description: translation.description || null,
          status: 1,
        }),
      ),
    );

    return this.findById(product.id, manager);
  }

  async upsertTranslations(
    productId: number,
    translations: ProductTranslationDto[],
    manager: EntityManager,
  ) {
    const translationRepository = this.getTranslationRepository(manager);

    for (const translation of translations) {
      const existing = await translationRepository.findOne({
        where: {
          product_id: productId,
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
            product_id: productId,
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
    await this.getProductRepository(manager)
      .createQueryBuilder()
      .update(ProductEntity)
      .set({ display_order: () => 'display_order + 1' })
      .where('is_delete = :isDelete', { isDelete: 0 })
      .andWhere('display_order >= :displayOrder', { displayOrder })
      .execute();
  }

  async shiftForUpdate(
    productId: number,
    oldOrder: number,
    newOrder: number,
    manager: EntityManager,
  ) {
    if (oldOrder === newOrder) return;

    const builder = this.getProductRepository(manager)
      .createQueryBuilder()
      .update(ProductEntity);

    if (newOrder < oldOrder) {
      await builder
        .set({ display_order: () => 'display_order + 1' })
        .where('is_delete = :isDelete', { isDelete: 0 })
        .andWhere('id != :productId', { productId })
        .andWhere('display_order >= :newOrder', { newOrder })
        .andWhere('display_order < :oldOrder', { oldOrder })
        .execute();
      return;
    }

    await builder
      .set({ display_order: () => 'display_order - 1' })
      .where('is_delete = :isDelete', { isDelete: 0 })
      .andWhere('id != :productId', { productId })
      .andWhere('display_order <= :newOrder', { newOrder })
      .andWhere('display_order > :oldOrder', { oldOrder })
      .execute();
  }

  async compactDisplayOrder(manager: EntityManager) {
    const products = await this.getProductRepository(manager).find({
      where: { is_delete: 0 },
      order: { display_order: 'ASC', id: 'ASC' },
    });

    await Promise.all(
      products.map((product, index) =>
        this.getProductRepository(manager).update(product.id, {
          display_order: index + 1,
        }),
      ),
    );
  }
}
