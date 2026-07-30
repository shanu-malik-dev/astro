import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThirdPartyModule } from '../third-party/third-party.module';
import { ProductController } from './controller/product.controller';
import { ProductTranslationEntity } from './entity/product-translation.entity';
import { ProductEntity } from './entity/product.entity';
import { ProductRepository } from './repository/product.repository';
import { ProductService } from './service/product.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity, ProductTranslationEntity]),
    ThirdPartyModule,
  ],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository],
})
export class ProductModule {}
