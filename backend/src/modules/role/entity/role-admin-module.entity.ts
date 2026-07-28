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
import { RoleEntity } from '../../auth/entity/role.entity';

@Entity({ name: DATABASE_TABLES.ROLE_ADMIN_MODULES })
@Index('uq_role_admin_modules_role_module', ['role_id', 'module_key'], {
  unique: true,
})
export class RoleAdminModuleEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  role_id: number;

  @Column({ type: 'varchar', length: 50 })
  module_key: string;

  @ManyToOne(() => RoleEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
