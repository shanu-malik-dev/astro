import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { successResponse } from '../../../common/helpers/response.helper';
import { RazorpayService } from '../../third-party/razorpay/razorpay.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { DeleteProductDto } from '../dto/delete-product.dto';
import { ListProductDto } from '../dto/list-product.dto';
import { ProductTranslationDto } from '../dto/product-translation.dto';
import { PurchaseProductDto } from '../dto/purchase-product.dto';
import { UpdateProductStatusDto } from '../dto/update-product-status.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductEntity } from '../entity/product.entity';
import { ProductRepository } from '../repository/product.repository';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly razorpayService: RazorpayService,
  ) {}

  async create(dto: CreateProductDto) {
    this.validateTranslations(dto.translations);

    const product = await this.productRepository.transaction(async (manager) => {
      await this.ensureUniqueCode(dto.product_code, undefined, manager);

      const total = await this.productRepository.findActiveCount(manager);
      const maxDisplayOrder = total + 1;
      if (dto.display_order && dto.display_order !== maxDisplayOrder) {
        throw new BadRequestException(`Display order must be ${maxDisplayOrder}.`);
      }

      const displayOrder = dto.display_order || maxDisplayOrder;
      await this.productRepository.shiftForInsert(displayOrder, manager);

      return this.productRepository.createProduct(
        {
          product_code: dto.product_code.trim(),
          product_image: dto.product_image.trim(),
          product_price: Number(dto.product_price),
          display_order: displayOrder,
        },
        dto.translations,
        manager,
      );
    });

    return successResponse('PRODUCT_CREATED', this.formatProduct(product));
  }

  async findAll(query: ListProductDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const skip = (page - 1) * limit;
    const sortOrder = query.sort_order === 'desc' ? 'DESC' : 'ASC';

    const queryBuilder = this.productRepository
      .getProductRepository()
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.translations', 'translation')
      .where('product.is_delete = :isDelete', { isDelete: 0 });

    if (query.status !== undefined) {
      queryBuilder.andWhere('product.status = :status', {
        status: query.status,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(product.product_code LIKE :search OR translation.name LIKE :search OR translation.description LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.date_from) {
      queryBuilder.andWhere('product.created_at >= :dateFrom', {
        dateFrom: new Date(query.date_from),
      });
    }

    if (query.date_to) {
      queryBuilder.andWhere('product.created_at <= :dateTo', {
        dateTo: new Date(query.date_to),
      });
    }

    const [products, total] = await queryBuilder
      .orderBy('product.display_order', sortOrder)
      .addOrderBy('product.id', sortOrder)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return successResponse('PRODUCT_LIST_FETCHED', {
      records: products.map((product) => this.formatProduct(product)),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  }

  async publicList() {
    const products = await this.productRepository.getProductRepository().find({
      where: { is_delete: 0, status: 1 },
      relations: { translations: true },
      order: { display_order: 'ASC', id: 'ASC' },
    });

    return successResponse(
      'PRODUCT_PUBLIC_LIST_FETCHED',
      products.map((product) => this.formatPublicProduct(product)),
    );
  }

  async purchase(dto: PurchaseProductDto) {
    const product = await this.productRepository.findPublicById(dto.product_id);
    if (!product) throw new NotFoundException('Product not found.');

    const productName = this.getEnglishName(product.translations || []);
    const paymentLink = await this.razorpayService.createPaymentLink(
      {
        id: product.id,
        customer_name: dto.customer_name?.trim() || 'Customer',
        country_code: dto.country_code || '+91',
        mobile: dto.mobile || '',
      },
      Number(product.product_price),
      'INR',
      {
        description: `Product purchase: ${productName}`,
        notes: {
          product_id: String(product.id),
          product_code: product.product_code,
        },
      },
    );

    return successResponse('PRODUCT_PAYMENT_LINK_CREATED', {
      product_id: product.id,
      product_name: productName,
      amount: Number(product.product_price),
      currency: 'INR',
      payment_link: paymentLink.paymentLink,
      provider_payment_id: paymentLink.providerPaymentId,
    });
  }

  async update(dto: UpdateProductDto) {
    if (dto.translations) this.validateTranslations(dto.translations);

    const product = await this.productRepository.transaction(async (manager) => {
      const existing = await this.productRepository.findById(dto.id, manager);
      if (!existing) throw new NotFoundException('Product not found.');

      if (dto.product_code) {
        await this.ensureUniqueCode(dto.product_code, dto.id, manager);
      }

      const total = await this.productRepository.findActiveCount(manager);
      if (dto.display_order && dto.display_order > total) {
        throw new BadRequestException(`Display order must be between 1 and ${total}.`);
      }
      const nextOrder = dto.display_order || existing.display_order;

      await this.productRepository.shiftForUpdate(
        existing.id,
        existing.display_order,
        nextOrder,
        manager,
      );

      await this.productRepository.getProductRepository(manager).update(dto.id, {
        product_code: dto.product_code?.trim() || existing.product_code,
        product_image: dto.product_image?.trim() || existing.product_image,
        product_price:
          dto.product_price !== undefined
            ? Number(dto.product_price).toFixed(2)
            : existing.product_price,
        display_order: nextOrder,
      });

      if (dto.translations) {
        await this.productRepository.upsertTranslations(
          dto.id,
          dto.translations,
          manager,
        );
      }

      await this.productRepository.compactDisplayOrder(manager);

      return this.productRepository.findById(dto.id, manager);
    });

    return successResponse('PRODUCT_UPDATED', this.formatProduct(product));
  }

  async updateStatus(dto: UpdateProductStatusDto) {
    const product = await this.productRepository.findById(dto.id);
    if (!product) throw new NotFoundException('Product not found.');

    await this.productRepository.getProductRepository().update(dto.id, {
      status: dto.status,
    });

    const updatedProduct = await this.productRepository.findById(dto.id);
    return successResponse('PRODUCT_STATUS_UPDATED', this.formatProduct(updatedProduct));
  }

  async delete(dto: DeleteProductDto) {
    await this.productRepository.transaction(async (manager) => {
      const product = await this.productRepository.findById(dto.id, manager);
      if (!product) throw new NotFoundException('Product not found.');

      await this.productRepository.getProductRepository(manager).update(dto.id, {
        is_delete: 1,
      });
      await this.productRepository.compactDisplayOrder(manager);
    });

    return successResponse('PRODUCT_DELETED');
  }

  private validateTranslations(translations: ProductTranslationDto[]) {
    const languageCodes = new Set(translations.map((item) => item.lang_code));
    if (!languageCodes.has('en') || !languageCodes.has('hi')) {
      throw new BadRequestException('English and Hindi product names are required.');
    }

    const hasBlankName = translations.some(
      (translation) => !translation.name?.trim(),
    );
    if (hasBlankName) {
      throw new BadRequestException('All language product names are required.');
    }
  }

  private async ensureUniqueCode(
    code: string,
    excludeProductId?: number,
    manager?: Parameters<ProductRepository['findById']>[1],
  ) {
    const productCode = code.trim();
    if (!productCode) throw new BadRequestException('Product code is required.');

    const exists = await this.productRepository.existsByCode(
      productCode,
      excludeProductId,
      manager,
    );

    if (exists) {
      throw new BadRequestException('Product code already exists.');
    }
  }

  private getEnglishName(
    translations: Array<{ lang_code: string; name: string }>,
  ) {
    return (
      translations.find((translation) => translation.lang_code === 'en')?.name ||
      translations[0]?.name ||
      ''
    );
  }

  private formatProduct(product?: ProductEntity | null) {
    if (!product) return null;

    const translations = [...(product.translations || [])].sort((a, b) =>
      a.lang_code.localeCompare(b.lang_code),
    );
    const english =
      translations.find((translation) => translation.lang_code === 'en') ||
      translations[0];

    return {
      id: product.id,
      product_code: product.product_code,
      product_image: product.product_image,
      product_price: Number(product.product_price),
      name: english?.name || '',
      description: english?.description || '',
      status: product.status,
      display_order: product.display_order,
      created_at: product.created_at,
      all_names: translations.map((translation) => ({
        label: translation.lang_code.toUpperCase(),
        value: translation.name,
        description: translation.description || '',
      })),
    };
  }

  private formatPublicProduct(product: ProductEntity) {
    const formatted = this.formatProduct(product);
    const hindi = product.translations?.find(
      (translation) => translation.lang_code === 'hi',
    );

    return {
      ...formatted,
      hi_label: hindi?.name || formatted?.name || '',
    };
  }
}
