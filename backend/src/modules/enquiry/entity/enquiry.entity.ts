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
import { ProblemEntity } from '../../problem/entity/problem.entity';

@Entity({ name: DATABASE_TABLES.ENQUIRIES })
@Index('idx_enquiries_customer_mobile', ['country_code', 'mobile'])
@Index('idx_enquiries_problem_status', ['problem_id', 'status', 'is_delete'])
@Index('idx_enquiries_status_delete', ['status', 'is_delete'])
export class EnquiryEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  customer_id: number | null;

  @Column({ type: 'varchar', length: 100 })
  customer_name: string;

  @Column({ type: 'varchar', length: 10 })
  country_code: string;

  @Column({ type: 'varchar', length: 20 })
  mobile: string;

  @Column({ type: 'bigint', unsigned: true })
  problem_id: number;

  @Column({ type: 'varchar', length: 150 })
  problem_name: string;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: 'open' | 'closed';

  @Column({ type: 'text', nullable: true })
  close_remark: string | null;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 0,
    comment: '1=Deleted, 0=Not Deleted',
  })
  is_delete: number;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: UserEntity | null;

  @ManyToOne(() => ProblemEntity, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'problem_id' })
  problem: ProblemEntity;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
