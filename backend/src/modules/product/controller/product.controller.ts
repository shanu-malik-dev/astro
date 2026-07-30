import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsPublic } from '../../auth/decorators/is-public.decorator';
import { CreateProductDto } from '../dto/create-product.dto';
import { DeleteProductDto } from '../dto/delete-product.dto';
import { ListProductDto } from '../dto/list-product.dto';
import { PurchaseProductDto } from '../dto/purchase-product.dto';
import { UpdateProductStatusDto } from '../dto/update-product-status.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductService } from '../service/product.service';

@ApiTags('product')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Post('list')
  findAll(@Body() dto: ListProductDto) {
    return this.productService.findAll(dto);
  }

  @IsPublic()
  @Post('public-list')
  publicList() {
    return this.productService.publicList();
  }

  @IsPublic()
  @Post('purchase')
  purchase(@Body() dto: PurchaseProductDto) {
    return this.productService.purchase(dto);
  }

  @Post('update')
  update(@Body() dto: UpdateProductDto) {
    return this.productService.update(dto);
  }

  @Post('status')
  updateStatus(@Body() dto: UpdateProductStatusDto) {
    return this.productService.updateStatus(dto);
  }

  @Post('delete')
  delete(@Body() dto: DeleteProductDto) {
    return this.productService.delete(dto);
  }
}
