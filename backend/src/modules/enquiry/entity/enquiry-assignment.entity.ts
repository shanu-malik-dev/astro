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
import { EnquiryEntity } from './enquiry.entity';

@Entity({ name: DATABASE_TABLES.ENQUIRY_ASSIGNMENTS })
@Index('uq_enquiry_assignments_enquiry', ['enq_id'], { unique: true })
@Index('idx_enquiry_assignments_executive_active', ['executive_id', 'is_active'])
export class EnquiryAssignmentEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  enq_id: number;

  @Column({ type: 'bigint', unsigned: true })
  executive_id: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  assigned_by: number | null;

  @Column({ type: 'tinyint', width: 1, default: 1 })
  is_active: number;

  @ManyToOne(() => EnquiryEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'enq_id' })
  enquiry: EnquiryEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'executive_id' })
  executive: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_by' })
  assignedBy: UserEntity | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
