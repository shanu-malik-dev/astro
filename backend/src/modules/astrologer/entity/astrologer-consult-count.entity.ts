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
import { UserEntity } from '../../auth/entity/user.entity';
import { AstrologerEntity } from './astrologer.entity';

@Entity({ name: DATABASE_TABLES.ASTROLOGER_CONSULT_COUNTS })
@Index('uq_astrologer_consult_counts_pair', ['astrologer_id', 'customer_id'], {
  unique: true,
})
@Index('idx_astrologer_consult_counts_customer', ['customer_id'])
export class AstrologerConsultCountEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  astrologer_id: number;

  @Column({ type: 'bigint', unsigned: true })
  customer_id: number;

  @Column({ type: 'int', unsigned: true, default: 1 })
  consult_count: number;

  @ManyToOne(() => AstrologerEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'astrologer_id' })
  astrologer: AstrologerEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: UserEntity;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
