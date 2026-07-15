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
import { UserEntity } from './user.entity';

@Entity({ name: DATABASE_TABLES.LOGIN_LOGS })
@Index('idx_login_logs_user_id', ['user_id'])
@Index('idx_login_logs_mobile', ['country_code', 'mobile'])
@Index('idx_login_logs_success', ['is_success'])
@Index('idx_login_logs_created_at', ['created_at'])
export class LoginLogEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  user_id: number | null;

  @Column({ type: 'varchar', length: 10 })
  country_code: string;

  @Column({ type: 'varchar', length: 20 })
  mobile: string;

  @Column({ type: 'varchar', length: 30, default: 'OTP' })
  login_type: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip_address: string | null;

  @Column({ type: 'text', nullable: true })
  user_agent: string | null;

  @Column({ type: 'tinyint', default: 0 })
  is_success: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  failure_reason: string | null;

  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
