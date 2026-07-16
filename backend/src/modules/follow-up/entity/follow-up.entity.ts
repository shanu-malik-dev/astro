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
import { EnquiryEntity } from '../../enquiry/entity/enquiry.entity';

@Entity({ name: DATABASE_TABLES.FOLLOW_UPS })
@Index('idx_follow_ups_status_delete', ['status', 'is_delete'])
@Index('idx_follow_ups_enquiry', ['enq_id'])
export class FollowUpEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  enq_id: number;

  @Column({ type: 'varchar', length: 100 })
  customer_name: string;

  @Column({ type: 'varchar', length: 10 })
  country_code: string;

  @Column({ type: 'varchar', length: 20 })
  mobile: string;

  @Column({ type: 'varchar', length: 150 })
  problem_name: string;

  @Column({ type: 'text' })
  remark: string;

  @Column({ type: 'varchar', length: 20 })
  status: 'hot' | 'warm' | 'cold';

  @Column({
    type: 'tinyint',
    width: 1,
    default: 0,
    comment: '1=Deleted, 0=Not Deleted',
  })
  is_delete: number;

  @ManyToOne(() => EnquiryEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'enq_id' })
  enquiry: EnquiryEntity;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
