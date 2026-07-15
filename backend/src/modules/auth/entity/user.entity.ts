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
import { RoleEntity } from './role.entity';

@Entity({ name: DATABASE_TABLES.USERS })
@Index('uq_users_country_mobile', ['country_code', 'mobile'], { unique: true })
@Index('idx_users_role_id', ['role_id'])
@Index('idx_users_status_delete', ['status', 'is_delete'])
@Index('idx_users_otp_expiry', ['otp_expiry'])
export class UserEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  role_id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  mobile: string;

  @Column({ type: 'varchar', length: 10 })
  country_code: string;

  @Column({ type: 'tinyint', default: 0 })
  is_delete: number;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  otp: string | null;

  @Column({ type: 'datetime', nullable: true })
  otp_expiry: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  token: string | null;

  @Column({ type: 'datetime', nullable: true })
  token_expiry: Date | null;

  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @ManyToOne(() => RoleEntity)
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
