import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DATABASE_TABLES } from '../../../common/constants/database.constant';
import { ProductTranslationEntity } from './product-translation.entity';

@Entity({ name: DATABASE_TABLES.PRODUCTS })
@Index('uq_products_code', ['product_code'], { unique: true })
@Index('idx_products_status_delete_order', [
  'status',
  'is_delete',
  'display_order',
])
export class ProductEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 50 })
  product_code: string;

  @Column({ type: 'text' })
  product_image: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  product_price: string;

  @Column({ type: 'int', unsigned: true, default: 1 })
  display_order: number;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: '1=Active, 0=Inactive',
  })
  status: number;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 0,
    comment: '1=Deleted, 0=Not Deleted',
  })
  is_delete: number;

  @OneToMany(() => ProductTranslationEntity, (translation) => translation.product)
  translations: ProductTranslationEntity[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
