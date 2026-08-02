import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DATABASE_TABLES } from '../../../common/constants/database.constant';
import { RoleAdminModuleEntity } from './role-admin-module.entity';

@Entity({ name: DATABASE_TABLES.MODULES })
@Index('uq_modules_module_key', ['module_key'], { unique: true })
@Index('idx_modules_status_sort', ['status', 'sort_order'])
export class ModuleEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 50 })
  module_key: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  parent_id: number | null;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @OneToMany(() => RoleAdminModuleEntity, (roleModule) => roleModule.module)
  roleModules: RoleAdminModuleEntity[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
