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
import { AstrologerEntity } from './astrologer.entity';

@Entity({ name: DATABASE_TABLES.ASTROLOGER_RATINGS })
@Index('idx_astrologer_ratings_astrologer', ['astrologer_id', 'status', 'is_delete'])
export class AstrologerRatingEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  astrologer_id: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  customer_id: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  customer_name: string | null;

  @Column({ type: 'tinyint', unsigned: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  review: string | null;

  @Column({ type: 'tinyint', width: 1, default: 1 })
  status: number;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  is_delete: number;

  @ManyToOne(() => AstrologerEntity, (astrologer) => astrologer.ratings, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'astrologer_id' })
  astrologer: AstrologerEntity;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
