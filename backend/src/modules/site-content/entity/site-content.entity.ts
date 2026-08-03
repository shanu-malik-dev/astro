import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DATABASE_TABLES } from '../../../common/constants/database.constant';

@Entity({ name: DATABASE_TABLES.SITE_CONTENT })
@Index('uq_site_content_key', ['content_key'], { unique: true })
export class SiteContentEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 120 })
  content_key: string;

  @Column({ type: 'text', nullable: true })
  content_value: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
