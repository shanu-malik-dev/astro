import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DATABASE_TABLES } from '../../../common/constants/database.constant';
import { ProductEntity } from './product.entity';

@Entity({ name: DATABASE_TABLES.PRODUCT_TRANSLATIONS })
@Index('uq_product_translation_lang', ['product_id', 'lang_code'], {
  unique: true,
})
@Index('idx_product_translation_lang_status', ['lang_code', 'status'])
export class ProductTranslationEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  product_id: number;

  @Column({ type: 'varchar', length: 10 })
  lang_code: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: '1=Active, 0=Inactive',
  })
  status: number;

  @ManyToOne(() => ProductEntity, (product) => product.translations, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
