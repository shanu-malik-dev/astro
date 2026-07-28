import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DATABASE_TABLES } from '../../../common/constants/database.constant';
import { SUPPORT_STATUS, SupportStatus } from '../../../common/constants/status.constant';

@Entity({ name: DATABASE_TABLES.SUPPORT_REQUESTS })
@Index('idx_support_requests_status_created', ['status', 'created_at'])
export class SupportRequestEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  full_name: string;

  @Column({ type: 'varchar', length: 150 })
  email: string;

  @Column({ type: 'varchar', length: 180, nullable: true })
  subject: string | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'tinyint', default: SUPPORT_STATUS.OPEN })
  status: SupportStatus;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
