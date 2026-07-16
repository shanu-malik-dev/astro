import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DATABASE_TABLES } from '../../../common/constants/database.constant';

@Entity({ name: DATABASE_TABLES.COUNTRIES })
export class CountryEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  country_name: string;

  @Column({ type: 'varchar', length: 10 })
  country_code: string;

  @Column({ type: 'varchar', length: 10, nullable: true, default: null })
  mobile_prefix: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  logo: string | null;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: '1=Active, 0=Inactive',
  })
  status: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
